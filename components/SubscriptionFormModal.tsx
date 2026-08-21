import React, { useState, useEffect } from 'react';
import { Subscription, SubscriptionType, SubscriptionPortal } from '../types';
import { X, Save } from 'lucide-react';

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscription: Subscription) => void;
  initialData?: Subscription | null;
}

const SubscriptionFormModal: React.FC<SubscriptionFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Subscription>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({
          id: crypto.randomUUID(),
          type: SubscriptionType.M365_APPS,
          assignmentDate: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Subscription);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = `mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Editar Subscrição' : 'Atribuir Nova Subscrição'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form id="subscription-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2">
            <h3 className="font-semibold text-blue-800 text-sm uppercase">Detalhes da Licença</h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de Subscrição</label>
            <select required name="type" value={formData.type} onChange={handleChange} className={inputClass}>
              {Object.values(SubscriptionType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {formData.type === SubscriptionType.VISUAL_STUDIO && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Portal de Atribuição</label>
              <select required name="portal" value={formData.portal || ''} onChange={handleChange} className={inputClass}>
                <option value="" disabled>Selecione um portal</option>
                {Object.values(SubscriptionPortal).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2 mt-2">
            <h3 className="font-semibold text-blue-800 text-sm uppercase">Dados do Colaborador</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input required name="name" value={formData.name || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Endereço de Email</label>
            <input required type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Manager</label>
            <input required name="managerName" value={formData.managerName || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Projeto</label>
            <input required name="project" value={formData.project || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2 mt-2">
            <h3 className="font-semibold text-blue-800 text-sm uppercase">Informação Adicional</h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Link do Ticket do Jira</label>
            <input type="text" name="jiraTicketUrl" value={formData.jiraTicketUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://jira.company.com/browse/TICKET-123 ou N/A" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data de Atribuição</label>
            <input required type="date" name="assignmentDate" value={formData.assignmentDate || ''} onChange={handleChange} className={inputClass} />
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3 sticky bottom-0 z-10">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm">
            Cancelar
          </button>
          <button 
            type="submit" 
            form="subscription-form"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <Save size={18}/>
            {initialData ? 'Gravar Alterações' : 'Atribuir Licença'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionFormModal;
