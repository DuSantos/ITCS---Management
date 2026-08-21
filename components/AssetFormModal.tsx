import React, { useState, useEffect } from 'react';
import { Asset, AssetStatus, Company, Location, UserProfile } from '../types';
import { X, Save, RefreshCw } from 'lucide-react';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  initialData?: Asset | null;
  mode: 'create' | 'edit' | 'renew' | 'view';
  currentUser: UserProfile;
  rentalType?: 'mac' | 'aluga';
}

const RENEWAL_STEPS = [
  "Enviar email ao manager perguntando se pretende renovar o aluguer",
  "Enviar email ao fornecedor a perguntar o preço da renovação",
  "Enviar email ao manager a informar o preço da renovação e se pretende continuar o processo",
  "Enviar email ao fornecedor a informar a intenção de renovar se o manager concordar",
  "Enviar email aos suppliers a pedir a PO",
  "Enviar o numero de PO ao fornecedor e finalizar o pedido"
];

const AssetFormModal: React.FC<AssetFormModalProps> = ({ isOpen, onClose, onSave, initialData, mode, currentUser, rentalType = 'mac' }) => {
  const [formData, setFormData] = useState<Partial<Asset>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        if (mode === 'renew') {
          const isAlreadyRenewing = initialData.renewalChecklist && initialData.renewalChecklist.some(c => !c);
          
          if (isAlreadyRenewing) {
            setFormData({ ...initialData });
          } else {
            // Renovação: Mantém o ID original para atualizar o registo existente
            const newStartDate = initialData.endDate;
            const duration = 12; // Default renewal duration

            const startObj = new Date(newStartDate);
            const endObj = new Date(startObj);
            endObj.setMonth(startObj.getMonth() + Number(duration));
            const newEndDate = endObj.toISOString().split('T')[0];

            setFormData({
              ...initialData,
              status: AssetStatus.PRODUCTION, // Forçar status ativo
              teamMember: currentUser.name,
              startDate: newStartDate,
              durationMonths: duration,
              endDate: newEndDate,
              renewalChecklist: Array(6).fill(false),
              lastUpdated: new Date().toISOString()
            });
          }
        } else {
          setFormData({ ...initialData });
        }
      } else {
        // Criar novo
        const today = new Date();
        const nextYear = new Date(today);
        nextYear.setMonth(today.getMonth() + 12);

        if (rentalType === 'aluga') {
          setFormData({
            id: crypto.randomUUID(),
            status: AssetStatus.PRODUCTION,
            company: Company.AGAP2IT,
            location: Location.LISBOA,
            teamMember: currentUser.name,
            monthlyValueExvat: 0,
            monthlyValueIncVat: 0,
            startDate: today.toISOString().split('T')[0],
          });
        } else {
          setFormData({
            id: crypto.randomUUID(),
            status: AssetStatus.PRODUCTION,
            company: Company.AGAP2IT,
            location: Location.LISBOA,
            teamMember: currentUser.name,
            monthlyValueExvat: 0,
            monthlyValueIncVat: 0,
            durationMonths: 12,
            startDate: today.toISOString().split('T')[0],
            endDate: nextYear.toISOString().split('T')[0],
          });
        }
      }
    }
  }, [initialData, mode, isOpen, currentUser, rentalType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'monthlyValueExvat') {
        const val = parseFloat(value) || 0;
        updated.monthlyValueIncVat = parseFloat((val * 1.23).toFixed(2));
      }
      
      if (name === 'startDate' || name === 'durationMonths') {
        const startStr = name === 'startDate' ? value : prev.startDate;
        const durStr = name === 'durationMonths' ? value : prev.durationMonths;
        
        if (rentalType === 'aluga') {
          if (startStr && durStr) {
            const start = new Date(startStr);
            const end = new Date(start);
            end.setMonth(start.getMonth() + Number(durStr));
            updated.endDate = end.toISOString().split('T')[0];
          } else {
            updated.endDate = undefined;
          }
        } else {
          if (startStr && durStr) {
            const start = new Date(startStr);
            const end = new Date(start);
            end.setMonth(start.getMonth() + Number(durStr));
            updated.endDate = end.toISOString().split('T')[0];
          }
        }
      }

      return updated;
    });
  };

  const handleChecklistChange = (index: number) => {
    setFormData(prev => {
      const newChecklist = [...(prev.renewalChecklist || Array(6).fill(false))];
      newChecklist[index] = !newChecklist[index];
      return { ...prev, renewalChecklist: newChecklist };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }
    
    const finalData = { ...formData };
    
    if (mode === 'renew' && finalData.renewalChecklist?.every(Boolean)) {
      // Renewal is being COMPLETED
      // Add the PREVIOUS state to history (which is in initialData)
      if (initialData) {
        const historyEntry = {
          startDate: initialData.startDate,
          endDate: initialData.endDate,
          proposalNumber: initialData.proposalNumber || '',
          poNumber: initialData.poNumber || '',
          monthlyValueExvat: Number(initialData.monthlyValueExvat) || 0,
          monthlyValueIncVat: Number(initialData.monthlyValueIncVat) || 0,
          renewedBy: currentUser.name,
          renewedAt: new Date().toISOString()
        };
        finalData.history = [...(initialData.history || []), historyEntry];
      }
      delete finalData.renewalChecklist;
    }
    
    onSave(finalData as Asset);
    onClose();
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const inputClass = `mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-800 disabled:cursor-not-allowed`;

  const getTitle = () => {
    switch(mode) {
      case 'create': return 'Novo Aluguer';
      case 'edit': return 'Editar Aluguer';
      case 'renew': return 'Renovar Aluguer';
      case 'view': return 'Detalhes do Aluguer';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form id="asset-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2">
            <h3 className="font-semibold text-blue-800 text-sm uppercase">Detalhes da Requisição</h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Membro da Equipa (Requerente)</label>
            <input disabled={isViewMode} required name="teamMember" value={formData.teamMember || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2 mt-2">
            <h3 className="font-semibold text-blue-800 text-sm uppercase">Consultor e Empresa</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Consultor (Utilizador Final)</label>
            <input disabled={isViewMode} required name="consultantName" value={formData.consultantName || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Projeto</label>
            <input disabled={isViewMode} name="project" value={formData.project || ''} onChange={handleChange} className={inputClass} placeholder="Ex: App Mobile" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Manager Responsável</label>
            <input disabled={isViewMode} required name="managerName" value={formData.managerName || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Link do Ticket do Jira</label>
            <input disabled={mode !== 'create'} type="text" name="jiraTicketUrl" value={formData.jiraTicketUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://jira.company.com/browse/TICKET-123 ou N/A" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Empresa</label>
            <select disabled={isViewMode} name="company" value={formData.company} onChange={handleChange} className={inputClass}>
              {Object.values(Company).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Localização</label>
            <select disabled={isViewMode} name="location" value={formData.location} onChange={handleChange} className={inputClass}>
              {Object.values(Location).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2 mt-4">
            <h3 className="font-semibold text-blue-800 text-sm uppercase">Dados do Equipamento</h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Características (Specs)</label>
            <input disabled={isViewMode} required name="equipmentSpecs" value={formData.equipmentSpecs || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Serial Number</label>
            <input disabled={isViewMode} required name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select disabled={isViewMode} name="status" value={formData.status} onChange={handleChange} className={inputClass}>
              {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2 mt-4">
            <h3 className="font-semibold text-blue-800 text-sm uppercase">Detalhes do Contrato & Faturação</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nº da Proposta (Fornecedor)</label>
            <input disabled={isViewMode} name="proposalNumber" value={formData.proposalNumber || ''} onChange={handleChange} className={inputClass} placeholder="Ex: PROP-2023-001" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Order (PO)</label>
            <input disabled={isViewMode} name="poNumber" value={formData.poNumber || ''} onChange={handleChange} className={inputClass} placeholder="Ex: PO-987654" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data Início</label>
            <input disabled={isViewMode} required type="date" name="startDate" value={formData.startDate || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {rentalType === 'aluga' ? 'Duração (Meses - Opcional / Renovação Automática)' : 'Duração (Meses)'}
            </label>
            {rentalType === 'aluga' ? (
              <input 
                disabled={isViewMode} 
                type="number" 
                name="durationMonths" 
                value={formData.durationMonths ?? ''} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="Sem limite (Renova mensalmente)" 
              />
            ) : (
              <input 
                disabled={isViewMode} 
                required 
                type="number" 
                name="durationMonths" 
                value={formData.durationMonths ?? ''} 
                onChange={handleChange} 
                className={inputClass} 
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {rentalType === 'aluga' ? 'Data Fim (Opcional - Definido na devolução)' : 'Data Fim (Calculada)'}
            </label>
            <input 
              disabled={isViewMode || rentalType !== 'aluga'} 
              type="date" 
              name="endDate" 
              value={formData.endDate || ''} 
              onChange={handleChange}
              className={inputClass} 
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div>
                <label className="block text-sm font-medium text-gray-700">Valor Mensal (Ex-VAT)</label>
                <input disabled={isViewMode} required type="number" step="0.01" name="monthlyValueExvat" value={formData.monthlyValueExvat || 0} onChange={handleChange} className={inputClass} />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Com IVA (23%)</label>
                <input disabled={isViewMode} required type="number" step="0.01" name="monthlyValueIncVat" value={formData.monthlyValueIncVat || 0} onChange={handleChange} className={inputClass} />
             </div>
          </div>

          <div className="md:col-span-2 bg-blue-50 p-3 rounded-md mb-2 mt-4">
            <h3 className="font-semibold text-blue-800 text-sm uppercase">Observações / Notas</h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notas Adicionais</label>
            <textarea disabled={isViewMode} name="observations" value={formData.observations || ''} onChange={handleChange} className={`${inputClass} resize-none`} rows={3} placeholder="Informações adicionais relevantes..." />
          </div>

          {(formData.history && formData.history.length > 0) && (
            <div className="md:col-span-2 mt-6">
              <div className="bg-gray-100 p-3 rounded-md mb-4">
                <h3 className="font-semibold text-gray-800 text-sm uppercase">Histórico de Aluguer</h3>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proposta/PO</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor (S/ IVA)</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Renovado por</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.history.map((entry, idx) => (
                      <tr key={idx} className="text-xs">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                          {new Date(entry.startDate).toLocaleDateString('pt-PT')} a {new Date(entry.endDate).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                          {entry.proposalNumber || 'N/A'} / {entry.poNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                          {(Number(entry.monthlyValueExvat) || 0).toFixed(2)} €
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                          <div>{entry.renewedBy}</div>
                          <div className="text-[10px]">{new Date(entry.renewedAt).toLocaleDateString('pt-PT')}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mode === 'renew' && (
            <>
              <div className="md:col-span-2 bg-purple-50 p-3 rounded-md mb-2 mt-4">
                <h3 className="font-semibold text-purple-800 text-sm uppercase">Checklist de Renovação</h3>
              </div>
              <div className="md:col-span-2 space-y-2">
                {RENEWAL_STEPS.map((step, index) => (
                  <label key={index} className="flex items-start gap-3 p-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-md cursor-pointer transition-colors shadow-sm">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="checkbox"
                        checked={formData.renewalChecklist?.[index] || false}
                        onChange={() => handleChecklistChange(index)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </div>
                    <div className="text-sm text-gray-700 font-medium leading-snug">{step}</div>
                  </label>
                ))}
              </div>
            </>
          )}
        </form>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3 sticky bottom-0 z-10">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm">
            {isViewMode ? 'Fechar' : 'Cancelar'}
          </button>
          {!isViewMode && mode !== 'renew' && (
            <button 
              type="submit" 
              form="asset-form"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm"
            >
              <Save size={18}/>
              {mode === 'create' ? 'Gravar Aluguer' : 'Gravar Alterações'}
            </button>
          )}
          {mode === 'renew' && (
            <>
              {!formData.renewalChecklist?.every(Boolean) && (
                <button
                  type="button"
                  onClick={() => {
                    const dataToSave = { ...formData, status: AssetStatus.RETURNED };
                    delete dataToSave.renewalChecklist;
                    onSave({ 
                      ...dataToSave, 
                      startDate: initialData?.startDate,
                      endDate: initialData?.endDate,
                      durationMonths: initialData?.durationMonths
                    } as Asset);
                    onClose();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 shadow-sm"
                >
                  Devolver Renovação
                </button>
              )}
              
              {formData.renewalChecklist?.every(Boolean) ? (
                <button 
                  type="submit" 
                  form="asset-form"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw size={18}/>
                  Confirmar Renovação
                </button>
              ) : (
                <button 
                  type="submit" 
                  form="asset-form"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 shadow-sm"
                >
                  <Save size={18}/>
                  Gravar Renovação
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetFormModal;