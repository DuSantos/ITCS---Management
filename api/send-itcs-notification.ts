import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    console.log(`[Vercel Serverless Email] Sending automatic notification for ${asset.consultantName} to ${to}...`);

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
        console.log(`[Vercel Serverless Email] Email successfully sent to ${to} via ${smtpHost}`);
      } catch (smtpError: any) {
        console.error("[Vercel Serverless Email] SMTP send failed, falling back to simulation log:", smtpError);
        sentStatus = `Failed to send via SMTP: ${smtpError.message || smtpError}. Logged locally.`;
      }
    } else {
      console.log(`[Vercel Serverless Email] SMTP environment variables are not configured. Simulated sending to ${to}.\nSubject: ${subject}\nBody:\n${emailBody}`);
    }

    return res.status(200).json({
      success: true,
      status: sentStatus,
      isSimulated,
      subject,
      recipient: to,
      body: emailBody
    });
  } catch (error: any) {
    console.error("Error in send-itcs-notification API on Vercel:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor ao processar notificação automática." });
  }
}
