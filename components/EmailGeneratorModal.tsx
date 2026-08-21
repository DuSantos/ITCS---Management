import React, { useEffect, useState } from 'react';
import { Asset } from '../types';
import { generateRenewalEmail, generateItcsNotificationEmail } from '../services/aiService';
import { X, Copy, Sparkles, Check, Mail } from 'lucide-react';

interface EmailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

const EmailGeneratorModal: React.FC<EmailGeneratorModalProps> = ({ isOpen, onClose, asset }) => {
  const [emailType, setEmailType] = useState<'manager' | 'itcs'>('manager');
  const [emailBody, setEmailBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && asset) {
      setIsLoading(true);
      setCopied(false);
      
      const emailPromise = emailType === 'manager' 
        ? generateRenewalEmail(asset)
        : generateItcsNotificationEmail(asset);

      emailPromise
        .then(text => setEmailBody(text))
        .catch(err => setEmailBody("Erro ao gerar email. Por favor tente novamente."))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, asset, emailType]);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    if (!asset) return;
    const recipient = emailType === 'manager' ? (asset.managerName || '') : 'itcs_operacao@moongy.pt';
    const subject = emailType === 'manager'
      ? `Renovação de Equipamento - ${asset.consultantName}`
      : `Notificação: Contrato de Arrendamento a Terminar / Renovação - ${asset.consultantName}`;

    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  if (!isOpen || !asset) return null;

  const recipientDisplay = emailType === 'manager' ? asset.managerName : 'itcs_operacao@moongy.pt';
  const subjectDisplay = emailType === 'manager'
    ? `Renovação de Equipamento - ${asset.consultantName}`
    : `Notificação: Contrato de Arrendamento a Terminar / Renovação - ${asset.consultantName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h2 className="text-lg font-bold">Assistente Gemini AI</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* Email Type Tabs Selection */}
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button 
              type="button"
              onClick={() => setEmailType('manager')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${emailType === 'manager' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-650 hover:text-gray-950'}`}
            >
              Email para Manager ({asset.managerName})
            </button>
            <button 
              type="button"
              onClick={() => setEmailType('itcs')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${emailType === 'itcs' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-650 hover:text-gray-950'}`}
            >
              Notificação ITCS Operação (itcs_operacao)
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 animate-pulse">A gerar email para {recipientDisplay}...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Envelop details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded border border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Destinatário (Para)</p>
                  <p className="text-gray-800 font-medium truncate">{recipientDisplay}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Assunto Sugerido</p>
                  <p className="text-gray-800 font-medium truncate">{subjectDisplay}</p>
                </div>
              </div>
              
              <div className="relative">
                 <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Corpo do Email</p>
                <textarea 
                  className="w-full h-80 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white text-sm leading-relaxed resize-none"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between gap-3 items-center">
          <p className="text-[11px] text-gray-500 hidden sm:block">
            {emailType === 'manager' 
              ? 'Envia feedback de renovação para o Manager do consultor.'
              : 'Envia notificação formal de término para itcs_operacao@moongy.pt.'}
          </p>
          <div className="flex justify-end gap-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 shadow-sm transition-all"
            >
              Fechar
            </button>
            <button 
              type="button"
              onClick={handleCopy} 
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-white flex items-center justify-center gap-2 shadow-sm transition-all ${copied ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700 font-semibold'}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button 
              type="button"
              onClick={handleSendEmail} 
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all font-semibold"
              title="Abrir o cliente de email nativo com o destinatário, assunto e corpo pré-preenchidos"
            >
              <Mail size={18} />
              <span>Enviar Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailGeneratorModal;