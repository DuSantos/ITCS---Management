import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { OTP } from "otplib";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

const authenticator = new OTP({ strategy: 'totp' });
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import crypto from "crypto";

let aiClient: GoogleGenAI | null = null;
const getAiClient = () => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
};

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-prod";

const db = new Database("database.sqlite");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS mailboxes (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS security_groups (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    mfa_secret TEXT,
    mfa_enabled INTEGER DEFAULT 0
  );
`);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Increase payload limit if needed
  app.use(express.json({ limit: '10mb' }));

  // --- AUTH API ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if user exists
      const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const id = crypto.randomUUID();
      
      db.prepare(
        "INSERT INTO users (id, first_name, last_name, email, password_hash, mfa_enabled) VALUES (?, ?, ?, ?, ?, 0)"
      ).run(id, firstName, lastName, email, passwordHash);

      res.json({ success: true, message: "User registered successfully" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // If MFA is enabled, we don't issue the full token yet
      if (user.mfa_enabled) {
        // Issue a temporary token for MFA verification
        const tempToken = jwt.sign({ id: user.id, mfaPending: true }, JWT_SECRET, { expiresIn: '5m' });
        return res.json({ mfaRequired: true, token: tempToken });
      }

      // No MFA, issue full token
      const token = jwt.sign({ id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        success: true, 
        token, 
        user: { 
          id: user.id, 
          name: `${user.first_name} ${user.last_name}`, 
          email: user.email 
        } 
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/mfa/setup", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
      
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const secret = authenticator.generateSecret();
      const otpauth = authenticator.generateURI({
        issuer: 'ITCS Management',
        label: user.email,
        secret
      });
      const qrCodeUrl = await qrcode.toDataURL(otpauth);

      // Save secret temporarily (or permanently but not enabled yet)
      db.prepare("UPDATE users SET mfa_secret = ? WHERE id = ?").run(secret, user.id);

      res.json({ secret, qrCodeUrl });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "MFA setup failed" });
    }
  });

  app.post("/api/auth/mfa/verify", async (req, res) => {
    try {
      const { token: mfaToken } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
      
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const result = await authenticator.verify({ token: mfaToken, secret: user.mfa_secret });
      const isValid = result.valid;
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid MFA code" });
      }

      // Enable MFA if it wasn't enabled
      if (!user.mfa_enabled) {
        db.prepare("UPDATE users SET mfa_enabled = 1 WHERE id = ?").run(user.id);
      }

      // Issue full token
      const fullToken = jwt.sign({ id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        success: true, 
        token: fullToken,
        user: { 
          id: user.id, 
          name: `${user.first_name} ${user.last_name}`, 
          email: user.email 
        } 
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "MFA verification failed" });
    }
  });

  // Middleware to protect routes
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err || user.mfaPending) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- ASSETS API ---
  app.get("/api/assets", authenticateToken, (req, res) => {
    try {
      const rows = db.prepare("SELECT data FROM assets").all();
      res.json(rows.map((row: any) => JSON.parse(row.data)));
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.post("/api/assets", authenticateToken, (req, res) => {
    try {
      const asset = req.body;
      db.prepare("INSERT OR REPLACE INTO assets (id, data) VALUES (?, ?)").run(asset.id, JSON.stringify(asset));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save asset" });
    }
  });

  app.delete("/api/assets/:id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM assets WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // --- SUBSCRIPTIONS API ---
  app.get("/api/subscriptions", authenticateToken, (req, res) => {
    try {
      const rows = db.prepare("SELECT data FROM subscriptions").all();
      res.json(rows.map((row: any) => JSON.parse(row.data)));
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", authenticateToken, (req, res) => {
    try {
      const sub = req.body;
      db.prepare("INSERT OR REPLACE INTO subscriptions (id, data) VALUES (?, ?)").run(sub.id, JSON.stringify(sub));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM subscriptions WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  // --- MAILBOXES API ---
  app.get("/api/mailboxes", authenticateToken, (req, res) => {
    try {
      const rows = db.prepare("SELECT data FROM mailboxes").all();
      res.json(rows.map((row: any) => JSON.parse(row.data)));
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch mailboxes" });
    }
  });

  app.post("/api/mailboxes", authenticateToken, (req, res) => {
    try {
      const mailbox = req.body;
      db.prepare("INSERT OR REPLACE INTO mailboxes (id, data) VALUES (?, ?)").run(mailbox.id, JSON.stringify(mailbox));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save mailbox" });
    }
  });

  app.delete("/api/mailboxes/:id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM mailboxes WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete mailbox" });
    }
  });

  // --- SECURITY GROUPS API ---
  app.get("/api/security-groups", authenticateToken, (req, res) => {
    try {
      const rows = db.prepare("SELECT data FROM security_groups").all();
      res.json(rows.map((row: any) => JSON.parse(row.data)));
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch security groups" });
    }
  });

  app.post("/api/security-groups", authenticateToken, (req, res) => {
    try {
      const group = req.body;
      db.prepare("INSERT OR REPLACE INTO security_groups (id, data) VALUES (?, ?)").run(group.id, JSON.stringify(group));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save security group" });
    }
  });

  app.delete("/api/security-groups/:id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM security_groups WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete security group" });
    }
  });

  // --- GEMINI EMAIL GENERATION API ---
  app.post("/api/generate-email", async (req, res) => {
    try {
      const { asset } = req.body;
      if (!asset) {
        return res.status(400).json({ error: "O equipamento ou dados do aluguer estão em falta." });
      }

      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        return res.status(500).json({ error: "A chave de API do Gemini não está configurada no servidor." });
      }

      const client = getAiClient();
      const today = new Date();
      const endDate = new Date(asset.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      const prompt = `
      Aja como um assistente administrativo eficiente.
      Escreva um email formal (em Português de Portugal) para o Manager (${asset.managerName}) sobre a renovação do equipamento Apple Mac alocado ao consultor (${asset.consultantName}).
      
      Detalhes do aluguer:
      - Equipamento: ${asset.equipmentSpecs}
      - Serial: ${asset.serialNumber}
      - Projeto: ${asset.project || 'N/A'}
      - Data de fim de contrato: ${endDate.toLocaleDateString('pt-PT')}
      - Dias restantes: ${daysRemaining > 0 ? daysRemaining : 'Expirado'}
      
      O objetivo é perguntar se devemos renovar o aluguer ou proceder com a devolução.
      
      IMPORTANTE: Na frase onde pede a confirmação, utilize exatamente a seguinte formulação (com os asteriscos para negrito):
      "agradeço que me confirme se devemos proceder à renovação do aluguer **e por quanto tempo (3, 6, ou 12 meses)**"

      Mantenha o tom profissional e direto. Apenas o corpo do email, sem assunto e sem placeholders.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const emailText = response.text || "Não foi possível gerar o email. Por favor tente novamente.";
      res.json({ emailText });
    } catch (error: any) {
      console.error("Erro ao gerar email com Gemini no servidor:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao ligar ao Gemini." });
    }
  });

  app.post("/api/generate-itcs-email", async (req, res) => {
    try {
      const { asset } = req.body;
      if (!asset) {
        return res.status(400).json({ error: "O equipamento ou dados do aluguer estão em falta." });
      }

      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        return res.status(500).json({ error: "A chave de API do Gemini não está configurada no servidor." });
      }

      const client = getAiClient();
      const endDateStr = asset.endDate ? new Date(asset.endDate).toLocaleDateString('pt-PT') : 'N/A';

      const prompt = `
      Aja como um assistente de departamento de TI da empresa Moongy.
      Escreva um email formal e conciso (em Português de Portugal) para itcs_operacao@moongy.pt.
      Notifique a equipa de que o portátil Apple Mac abaixo referenciado está próximo de atingir a sua data de renovação ou devolução e de que o respetivo contrato de arrendamento/aluguer está a terminar.
      
      Detalhes do equipamento:
      - Consultor: ${asset.consultantName}
      - Manager: ${asset.managerName}
      - Equipamento: ${asset.equipmentSpecs}
      - Número de Série: ${asset.serialNumber}
      - Proposta de Aluguer: ${asset.proposalNumber || 'N/A'}
      - Número de PO: ${asset.poNumber || 'N/A'}
      - Data de Fim do Contrato: ${endDateStr}
      
      O tom deve ser profissional, direto e prestável. Peça o acompanhamento da renovação ou o início do processo de recolha/devolução caso se aplique.
      Apenas o corpo do email, sem assunto e sem placeholders.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const emailText = response.text || "Não foi possível gerar o email. Por favor tente novamente.";
      res.json({ emailText });
    } catch (error: any) {
      console.error("Erro ao gerar email para a ITCS com Gemini no servidor:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao ligar ao Gemini para o email da ITCS." });
    }
  });

  app.post("/api/send-itcs-notification", async (req, res) => {
    try {
      const { asset, emailText } = req.body;
      if (!asset) {
        return res.status(400).json({ error: "O equipamento está em falta." });
      }

      const emailBody = emailText || `Olá equipa ITCS Operação,

Vimos por este meio notificar que o seguinte equipamento Apple Mac (aluguer FUTURDATA) está próximo de atingir a sua data de renovação ou devolução, encontrando-se o respetivo contrato de arrendamento a terminar.

Ficha do Equipamento:
• Consultor: ${asset.consultantName}
• Manager: ${asset.managerName}
• Equipamento: ${asset.equipmentSpecs}
• Número de Série/Serial: ${asset.serialNumber}
• Proposta de Aluguer: ${asset.proposalNumber || 'N/A'}
• Número de PO: ${asset.poNumber || 'N/A'}
• Data de Fim do Contrato: ${asset.endDate ? new Date(asset.endDate).toLocaleDateString('pt-PT') : 'N/A'}

Agradecemos o acompanhamento deste processo junto do respetivo fornecedor para efetuar a renovação ou, em caso de término, dar suporte operacional na devolução do portátil.

Com os melhores cumprimentos,
Operação de Gestão de Ativos`;

      const subject = `Notificação Automática: Contrato de Arrendamento a Terminar / Renovação - ${asset.consultantName}`;
      const to = "itcs_operacao@moongy.pt";

      console.log(`[Email Automatic] Sending automatic notification for ${asset.consultantName} to ${to}...`);

      const smtpHost = process.env.SMTP_HOST || "";
      const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
      const smtpUser = process.env.SMTP_USER || "";
      const smtpPass = process.env.SMTP_PASS || "";
      const smtpFrom = process.env.SMTP_FROM || "itcs_alertas@moongy.pt";

      let sentStatus = "Simulated / Logged locally";
      let isSimulated = true;

      if (smtpHost && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          await transporter.sendMail({
            from: smtpFrom,
            to: to,
            subject: subject,
            text: emailBody,
          });

          sentStatus = "Sent successfully via SMTP";
          isSimulated = false;
          console.log(`[Email Automatic] Email successfully sent to ${to} via ${smtpHost}`);
        } catch (smtpError: any) {
          console.error("[Email Automatic] SMTP send failed, falling back to simulation log:", smtpError);
          sentStatus = `Failed to send via SMTP: ${smtpError.message || smtpError}. Logged locally.`;
        }
      } else {
        console.log(`[Email Automatic] SMTP environment variables are not configured. Simulated sending to ${to}.\nSubject: ${subject}\nBody:\n${emailBody}`);
      }

      res.json({
        success: true,
        status: sentStatus,
        isSimulated,
        subject,
        recipient: to,
        body: emailBody
      });
    } catch (error: any) {
      console.error("Error in send-itcs-notification API:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao processar notificação automática." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const path = await import("path");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
