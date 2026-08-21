import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

export const generateRenewalEmail = async (asset: Asset): Promise<string> => {
  // Check if a client-side env variable prefix is configured for static hosting (Vercel)
  const clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  // 1. Try calling the backend endpoint first (works on Render.com/VPS/Local with persistent Node.js servers)
  try {
    const response = await fetch('/api/generate-email', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ asset }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.emailText) {
        return data.emailText;
      }
    }
  } catch (error) {
    console.warn("Express backend endpoint '/api/generate-email' is unreachable. Falling back to direct client-side generation...", error);
  }

  // 2. Client-side fallback using VITE_GEMINI_API_KEY (ideal for Vercel/Netlify/GitHub Pages static hosting)
  if (clientApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
      const today = new Date();
      const endDate = new Date(asset.endDate || '');
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      return response.text || "Não foi possível gerar o email. Por favor tente novamente.";
    } catch (clientError: any) {
      console.error("Erro na geração de email direta (client-side):", clientError);
      return `Erro na geração direta: ${clientError.message || "Por favor, verifique se a chave de API fornecida em VITE_GEMINI_API_KEY é válida."}`;
    }
  }

  return "Erro ao gerar email. Se estiver a alojar no Vercel (que apenas serve ficheiros estáticos por defeito), por favor adicione a chave de API com a variável de ambiente VITE_GEMINI_API_KEY nas configurações do Vercel para gerar o email diretamente no browser. Se estiver no Render.com, verifique se a chave GEMINI_API_KEY está configurada no painel de controlo do Render.";
};

export const generateItcsNotificationEmail = async (asset: Asset): Promise<string> => {
  const clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  // 1. Try calling the backend endpoint first
  try {
    const response = await fetch('/api/generate-itcs-email', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ asset }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.emailText) {
        return data.emailText;
      }
    }
  } catch (error) {
    console.warn("Express backend endpoint '/api/generate-itcs-email' is unreachable. Falling back to direct client-side generation...", error);
  }

  // 2. Client-side fallback using VITE_GEMINI_API_KEY
  if (clientApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
      const today = new Date();
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      return response.text || "Não foi possível gerar o email. Por favor tente novamente.";
    } catch (clientError: any) {
      console.error("Erro na geração de email da ITCS direta (client-side):", clientError);
    }
  }

  // Pure Local Template Fallback in case Gemini is offline or not configured
  const endDateStr = asset.endDate ? new Date(asset.endDate).toLocaleDateString('pt-PT') : 'N/A';
  return `Olá equipa ITCS Operação,

Vimos por este meio notificar que o seguinte equipamento Apple Mac (aluguer FUTURDATA) está próximo de atingir a sua data de renovação ou devolução, encontrando-se o respetivo contrato de arrendamento a terminar.

Ficha do Equipamento:
• Consultor: ${asset.consultantName}
• Manager: ${asset.managerName}
• Equipamento: ${asset.equipmentSpecs}
• Número de Série/Serial: ${asset.serialNumber}
• Proposta de Aluguer: ${asset.proposalNumber || 'N/A'}
• Número de PO: ${asset.poNumber || 'N/A'}
• Data de Fim do Contrato: ${endDateStr}

Agradecemos o acompanhamento deste processo junto do respetivo fornecedor para efetuar a renovação ou, em caso de término, dar suporte operacional na devolução do portátil.

Com os melhores cumprimentos,
Operação de Gestão de Ativos`;
};