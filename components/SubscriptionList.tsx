import React, { useState } from 'react';
import { Subscription, SubscriptionType } from '../types';
import { Edit2, Search, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
}

const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions, onEdit, onDelete }) => {
  const [filterText, setFilterText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesText = 
      sub.name.toLowerCase().includes(filterText.toLowerCase()) ||
      sub.email.toLowerCase().includes(filterText.toLowerCase()) ||
      sub.managerName.toLowerCase().includes(filterText.toLowerCase()) ||
      sub.project.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesType = selectedType === 'ALL' || sub.type === selectedType;

    return matchesText && matchesType;
  });

  const exportToExcel = () => {
    try {
      const dataToExport = filteredSubscriptions.map(sub => ({
        'Nome': sub.name,
        'Email': sub.email,
        'Manager': sub.managerName,
        'Projeto': sub.project,
        'Tipo': sub.type,
        'Data Atribuição': new Date(sub.assignmentDate).toLocaleDateString('pt-PT'),
        'Jira Ticket': sub.jiraTicketUrl,
        'Portal': sub.portal || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Subscrições");
      XLSX.writeFile(workbook, `subscricoes_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      alert("Ocorreu um erro ao exportar os dados.");
    }
  };

  const groupedSubscriptions = selectedType === 'ALL' 
    ? Object.values(SubscriptionType).reduce((acc, type) => {
        const typeSubs = filteredSubscriptions.filter(s => s.type === type);
        if (typeSubs.length > 0) acc[type] = typeSubs;
        return acc;
      }, {} as Record<string, Subscription[]>)
    : { [selectedType]: filteredSubscriptions };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100">
      <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
          <div className="relative w-full md:w-64">
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

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button 
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${selectedType === 'ALL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Todas
            </button>
            {Object.values(SubscriptionType).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${selectedType === type ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={exportToExcel}
          disabled={filteredSubscriptions.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <Download size={18} />
          Exportar Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        {Object.entries(groupedSubscriptions).map(([type, list]) => (
          <div key={type} className="border-b last:border-b-0 border-gray-200">
            <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {type}
              </div>
              <div className="text-xs font-medium text-gray-500">
                Total Contabilizado: <span className="text-blue-600 font-bold">{list.filter(s => !s.project?.toLowerCase().includes('no license')).length}</span>
                {list.some(s => s.project?.toLowerCase().includes('no license')) && (
                  <span className="ml-2">
                    ({list.filter(s => s.project?.toLowerCase().includes('no license')).length} sem licença)
                  </span>
                )}
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager / Projeto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jira Ticket</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data / Portal</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map((sub) => {
                  const isNoLicense = sub.project?.toLowerCase().includes('no license');
                  return (
                    <tr key={sub.id} className={`hover:bg-blue-50 transition-colors ${isNoLicense ? 'bg-gray-50 opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sub.name}
                          {isNoLicense && <span className="ml-2 inline-block px-2 py-0.5 text-[10px] bg-gray-200 text-gray-600 rounded">SEM LICENÇA</span>}
                        </div>
                        <div className="text-sm text-gray-500">{sub.email}</div>
                      </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sub.managerName}</div>
                      <div className="text-xs text-gray-500">{sub.project}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={sub.jiraTicketUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        Ver Ticket
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(sub.assignmentDate).toLocaleDateString('pt-PT')}</div>
                      {sub.type === SubscriptionType.VISUAL_STUDIO && sub.portal && (
                        <div className="text-xs text-blue-600 font-medium mt-1">Portal: {sub.portal}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => onEdit(sub)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDelete(sub)} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {filteredSubscriptions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhuma subscrição encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionList;
