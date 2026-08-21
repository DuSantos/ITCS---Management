import React, { useState } from 'react';
import { Asset, Company } from '../types';
import { Edit2, RefreshCw, Search, Eye, Mail, Trash2, FileSpreadsheet } from 'lucide-react';
import ExportExcelModal from './ExportExcelModal';

interface AssetListProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onRenew: (asset: Asset) => void;
  onView: (asset: Asset) => void;
  onGenerateEmail: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onResendItcsNotification?: (asset: Asset) => void;
  filterText?: string;
  onFilterTextChange?: (text: string) => void;
  selectedCompany?: string;
  onSelectedCompanyChange?: (company: string) => void;
  type?: 'mac' | 'aluga';
}

const AssetList: React.FC<AssetListProps> = ({ 
  assets, 
  onEdit, 
  onRenew, 
  onView, 
  onGenerateEmail, 
  onDelete,
  onResendItcsNotification,
  filterText: propFilterText,
  onFilterTextChange,
  selectedCompany: propSelectedCompany,
  onSelectedCompanyChange,
  type = 'mac'
}) => {
  const [localFilterText, setLocalFilterText] = useState('');
  const [localSelectedCompany, setLocalSelectedCompany] = useState<string>('ALL');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const filterText = propFilterText !== undefined ? propFilterText : localFilterText;
  const setFilterText = onFilterTextChange || setLocalFilterText;

  const selectedCompany = propSelectedCompany !== undefined ? propSelectedCompany : localSelectedCompany;
  const setSelectedCompany = onSelectedCompanyChange || setLocalSelectedCompany;

  const filteredAssets = assets.filter(asset => {
    const matchesText = 
      asset.consultantName.toLowerCase().includes(filterText.toLowerCase()) ||
      asset.equipmentSpecs.toLowerCase().includes(filterText.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      asset.managerName.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesCompany = selectedCompany === 'ALL' || asset.company === selectedCompany;

    return matchesText && matchesCompany;
  });

  const groupedAssets = selectedCompany === 'ALL' 
    ? Object.values(Company).reduce((acc, company) => {
        const companyAssets = filteredAssets.filter(a => a.company === company);
        if (companyAssets.length > 0) acc[company] = companyAssets;
        return acc;
      }, {} as Record<string, Asset[]>)
    : { [selectedCompany]: filteredAssets };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100">
      <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Pesquisar..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-emerald-200 text-sm font-semibold rounded-md shadow-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none active:scale-95 transition-all gap-2"
            title="Exportar dados para Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={() => setSelectedCompany('ALL')}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${selectedCompany === 'ALL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todas
          </button>
          {Object.values(Company).map(company => (
            <button
              key={company}
              onClick={() => setSelectedCompany(company)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${selectedCompany === company ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {company}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {Object.entries(groupedAssets).map(([company, list]) => (
          <div key={company} className="border-b last:border-b-0 border-gray-200">
            <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {company} ({list.length})
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultor / Manager</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipamento</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datas</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status / Jira</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map((asset) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const hasEndDate = !!asset.endDate;
                  const endDate = hasEndDate ? new Date(asset.endDate || '') : null;
                  if (endDate) {
                    endDate.setHours(0, 0, 0, 0);
                  }
                  
                  const diffTime = endDate ? endDate.getTime() - today.getTime() : 0;
                  const diffDays = endDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 9999;
                  
                  let statusColorClass = 'hover:bg-blue-50';
                  let badgeColorClass = 'bg-green-100 text-green-800';
                  let expiryMessage = '';
 
                  const isUnderRenewal = asset.renewalChecklist && asset.renewalChecklist.some(c => !c);

                  if (isUnderRenewal) {
                    statusColorClass = 'bg-purple-50 hover:bg-purple-100';
                    badgeColorClass = 'bg-purple-100 text-purple-800';
                    expiryMessage = 'Em Renovação';
                  } else if (asset.status === 'Em Produção') {
                    if (type === 'aluga') {
                      if (hasEndDate && endDate && diffDays <= 0) {
                        statusColorClass = 'bg-red-50 hover:bg-red-100';
                        badgeColorClass = 'bg-red-100 text-red-800';
                        expiryMessage = 'Devolução Planeada/Terminado';
                      } else if (hasEndDate && endDate && diffDays <= 30) {
                        statusColorClass = 'bg-amber-50 hover:bg-amber-100';
                        badgeColorClass = 'bg-amber-100 text-amber-800';
                        expiryMessage = `Devolução em ${diffDays} dias`;
                      } else {
                        statusColorClass = 'bg-green-50 hover:bg-green-100';
                        badgeColorClass = 'bg-green-100 text-green-800';
                        expiryMessage = 'Renovação Automática';
                      }
                    } else {
                      if (diffDays <= 0) {
                        statusColorClass = 'bg-red-50 hover:bg-red-100';
                        badgeColorClass = 'bg-red-100 text-red-800';
                        expiryMessage = 'Contrato Terminado';
                      } else if (diffDays <= 30) {
                        statusColorClass = 'bg-amber-50 hover:bg-amber-100';
                        badgeColorClass = 'bg-amber-100 text-amber-800';
                        expiryMessage = `Expira em ${diffDays} dias`;
                      } else {
                        statusColorClass = 'bg-green-50 hover:bg-green-100';
                        badgeColorClass = 'bg-green-100 text-green-800';
                      }
                    }
                  } else if (asset.status === 'Em Stock') {
                    badgeColorClass = 'bg-yellow-100 text-yellow-800';
                  } else {
                    badgeColorClass = 'bg-gray-100 text-gray-800';
                  }
 
                  return (
                    <tr 
                      key={asset.id} 
                      className={`transition-colors cursor-pointer border-l-4 ${
                        isUnderRenewal ? 'border-purple-500' :
                        type !== 'aluga' && diffDays <= 0 && asset.status === 'Em Produção' ? 'border-red-500' : 
                        type !== 'aluga' && diffDays <= 30 && asset.status === 'Em Produção' ? 'border-amber-500' : 
                        type === 'aluga' && hasEndDate && endDate && diffDays <= 0 && asset.status === 'Em Produção' ? 'border-red-500' :
                        type === 'aluga' && hasEndDate && endDate && diffDays <= 30 && asset.status === 'Em Produção' ? 'border-amber-500' :
                        asset.status === 'Em Produção' ? 'border-green-500' : 'border-transparent'
                      } ${statusColorClass}`}
                      onClick={() => onView(asset)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {asset.consultantName} {asset.project && <span className="text-xs text-gray-500 font-normal">({asset.project})</span>}
                        </div>
                        <div className="text-sm text-gray-500">{asset.managerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{asset.equipmentSpecs}</div>
                        <div className="text-xs text-gray-500">SN: {asset.serialNumber} | Prop: {asset.proposalNumber || 'N/A'} | PO: {asset.poNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(asset.startDate).toLocaleDateString('pt-PT')}
                          {hasEndDate && asset.endDate ? ` - ${new Date(asset.endDate).toLocaleDateString('pt-PT')}` : ' - Renovação Automática'}
                        </div>
                        <div className="flex flex-col gap-1 mt-1 items-start">
                          {expiryMessage && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeColorClass}`}>
                              {expiryMessage}
                            </span>
                          )}
                          {asset.itcsNotified ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100" title={`Notificado automaticamente para itcs_operacao@moongy.pt em ${new Date(asset.itcsNotificationDate || '').toLocaleString('pt-PT')}`}>
                                ✓ Auto-Notificado ITCS ({new Date(asset.itcsNotificationDate || '').toLocaleDateString('pt-PT')})
                              </span>
                              {onResendItcsNotification && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onResendItcsNotification(asset); }}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-0.5 ml-0.5"
                                  title="Reenviar e-mail de notificação para itcs_operacao@moongy.pt via SMTP"
                                >
                                  <RefreshCw size={10} className="inline animate-none hover:rotate-180 transition-transform duration-500" />
                                  <span>Reenviar</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            (asset.status === 'Em Produção' && diffDays <= 30 && onResendItcsNotification) && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onResendItcsNotification(asset); }}
                                className="mt-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1"
                                title="Enviar alerta de fim de contrato para a ITCS imediatamente via SMTP"
                              >
                                <RefreshCw size={10} className="inline" />
                                <span>Enviar Alerta ITCS</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="mb-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeColorClass}`}>
                            {isUnderRenewal ? 'Em Renovação' : asset.status}
                          </span>
                        </div>
                        {asset.jiraTicketUrl && (
                          <a 
                            href={asset.jiraTicketUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver Ticket
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-1">
                          {diffDays <= 30 && asset.status === 'Em Produção' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onGenerateEmail(asset); }}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                              title="Gerar Email (Manager ou ITCS Operação)"
                            >
                              <Mail size={18} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onView(asset); }} 
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" 
                            title="Ver Detalhes"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(asset); }} 
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onRenew(asset); }} 
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" 
                            title="Renovar"
                          >
                            <RefreshCw size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(asset); }} 
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
        {filteredAssets.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum aluguer encontrado.
          </div>
        )}
      </div>
      <ExportExcelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        assets={assets}
        type={type}
      />
    </div>
  );
};

export default AssetList;
