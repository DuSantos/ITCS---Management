import { GoogleGenAI } from "@google/genai";

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
    const { asset } = req.body;
    if (!asset) {
      return res.status(400).json({ error: "O equipamento ou dados do aluguer estão em falta." });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: "A chave de API do Gemini não está configurada no servidor Vercel." });
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
    return res.json({ emailText });
  } catch (error: any) {
    console.error("Erro ao gerar email com Gemini no Vercel:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor ao ligar ao Gemini." });
  }
}
