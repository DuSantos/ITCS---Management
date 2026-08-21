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
    return res.json({ emailText });
  } catch (error: any) {
    console.error("Erro ao gerar email ITCS com Gemini no Vercel:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor ao ligar ao Gemini." });
  }
}
