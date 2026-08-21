import React, { useState, useEffect } from 'react';
import { Mailbox, MailboxType, DistributionListType, MailboxMember } from '../types';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface MailboxFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mailbox: Mailbox) => void;
  initialData?: Mailbox | null;
}

const MailboxFormModal: React.FC<MailboxFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Mailbox>>({});
  const [members, setMembers] = useState<MailboxMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
        setMembers(
          initialData.type === MailboxType.SHARED_MAILBOX 
            ? initialData.delegatedTo || [] 
            : initialData.members || []
        );
      } else {
        setFormData({
          id: crypto.randomUUID(),
          type: MailboxType.SHARED_MAILBOX,
          creationDate: new Date().toISOString().split('T')[0],
        });
        setMembers([]);
      }
      setNewMemberName('');
      setNewMemberEmail('');
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMember = () => {
    if (newMemberName.trim() && newMemberEmail.trim()) {
      setMembers([...members, { name: newMemberName.trim(), email: newMemberEmail.trim() }]);
      setNewMemberName('');
      setNewMemberEmail('');
    }
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalData: Partial<Mailbox> = { ...formData };
    
    if (finalData.type === MailboxType.SHARED_MAILBOX) {
      finalData.delegatedTo = members;
      delete finalData.distributionType;
      delete finalData.members;
    } else {
      finalData.members = members;
      delete finalData.delegatedTo;
    }

    onSave(finalData as Mailbox);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = `mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Editar Registo' : 'Novo Registo'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="mailbox-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2">
              <h3 className="font-semibold text-blue-800 text-sm uppercase">Detalhes Principais</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select required name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                {Object.values(MailboxType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {formData.type === MailboxType.DISTRIBUTION_LIST && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Tipo de Lista</label>
                <select required name="distributionType" value={formData.distributionType || ''} onChange={handleChange} className={inputClass}>
                  <option value="" disabled>Selecione um tipo</option>
                  {Object.values(DistributionListType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input required name="displayName" value={formData.displayName || ''} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Endereço de Email</label>
              <input required type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quem pediu a criação</label>
              <input required name="requestedBy" value={formData.requestedBy || ''} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Criação</label>
              <input required type="date" name="creationDate" value={formData.creationDate || ''} onChange={handleChange} className={inputClass} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Link do Ticket do Jira</label>
              <input type="text" name="jiraTicketUrl" value={formData.jiraTicketUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://jira.company.com/browse/TICKET-123 ou N/A" />
            </div>

            <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2 mt-4">
              <h3 className="font-semibold text-blue-800 text-sm uppercase">
                {formData.type === MailboxType.SHARED_MAILBOX ? 'Delegada a' : 'Membros da Lista'}
              </h3>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500">Nome</label>
                  <input 
                    type="text" 
                    value={newMemberName} 
                    onChange={(e) => setNewMemberName(e.target.value)} 
                    className={inputClass} 
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500">Email</label>
                  <input 
                    type="email" 
                    value={newMemberEmail} 
                    onChange={(e) => setNewMemberEmail(e.target.value)} 
                    className={inputClass} 
                    placeholder="Ex: joao.silva@empresa.com"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim() || !newMemberEmail.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 h-10 w-full sm:w-auto justify-center"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>

              {members.length > 0 ? (
                <div className="border border-gray-200 rounded-md overflow-hidden mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map((member, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{member.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{member.email}</td>
                          <td className="px-4 py-2 text-right">
                            <button 
                              type="button"
                              onClick={() => handleRemoveMember(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed border-gray-300 rounded-md text-gray-500 text-sm">
                  Nenhuma pessoa adicionada ainda.
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm">
            Cancelar
          </button>
          <button 
            type="submit" 
            form="mailbox-form"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <Save size={18}/>
            {initialData ? 'Gravar Alterações' : 'Criar Registo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MailboxFormModal;
