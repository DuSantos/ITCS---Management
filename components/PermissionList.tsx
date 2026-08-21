import React, { useState } from 'react';
import { SecurityGroupRecord, PermissionCompany, PermissionType } from '../types';
import { Edit2, Search, Trash2, Shield, Users, ExternalLink, ChevronDown, ChevronRight, FileSpreadsheet, Download, ChevronsUpDown, ChevronsDownUp, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import PermissionFormGenerator from './PermissionFormGenerator';

interface PermissionListProps {
  securityGroups: SecurityGroupRecord[];
  onEdit: (group: SecurityGroupRecord) => void;
  onDelete: (group: SecurityGroupRecord) => void;
}

const PermissionList: React.FC<PermissionListProps> = ({ securityGroups, onEdit, onDelete }) => {
  const [filterText, setFilterText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeSegment, setActiveSegment] = useState<'current' | 'request'>('current');

  // Excel Export State
  const [exportEmail, setExportEmail] = useState('');
  const [exportGroup, setExportGroup] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const toggleCompany = (company: string) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [company]: !prev[company]
    }));
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const collapseAllCompanyGroups = (companyGroups: SecurityGroupRecord[]) => {
    setCollapsedGroups(prev => {
      const updated = { ...prev };
      companyGroups.forEach(g => {
        updated[g.id] = true;
      });
      return updated;
    });
  };

  const expandAllCompanyGroups = (companyGroups: SecurityGroupRecord[]) => {
    setCollapsedGroups(prev => {
      const updated = { ...prev };
      companyGroups.forEach(g => {
        updated[g.id] = false;
      });
      return updated;
    });
  };

  const filteredGroups = securityGroups.filter(group => {
    const matchesText = 
      group.name.toLowerCase().includes(filterText.toLowerCase()) ||
      group.members.some(m => 
        m.userName.toLowerCase().includes(filterText.toLowerCase()) ||
        m.userEmail.toLowerCase().includes(filterText.toLowerCase())
      );
    
    const matchesCompany = selectedCompany === 'ALL' || group.company === selectedCompany;

    return matchesText && matchesCompany;
  });

  const groupedByCompany = selectedCompany === 'ALL' 
    ? Object.values(PermissionCompany).reduce((acc, company) => {
        const companyGroups = filteredGroups.filter(g => g.company === company);
        if (companyGroups.length > 0) acc[company] = companyGroups;
        return acc;
      }, {} as Record<string, SecurityGroupRecord[]>)
    : { [selectedCompany]: filteredGroups };

  // Generate Excel workbook
  const handleExportToExcel = (mode: 'filtered' | 'complete') => {
    setIsExporting(true);
    try {
      const filteredData: any[] = [];

      const matchesFilters = (mEmail: string, gName: string) => {
        if (mode === 'complete') return true;
        
        const emailFilter = exportEmail.trim().toLowerCase();
        const groupFilter = exportGroup.trim().toLowerCase();
        
        const matchesEmail = !emailFilter || mEmail.toLowerCase().includes(emailFilter);
        const matchesGroup = !groupFilter || gName.toLowerCase().includes(groupFilter);
        
        return matchesEmail && matchesGroup;
      };

      // Traverse all securityGroups and their members
      securityGroups.forEach(group => {
        if (group.members && group.members.length > 0) {
          group.members.forEach(member => {
            if (matchesFilters(member.userEmail, group.name)) {
              filteredData.push({
                'Empresa (Company)': group.company || '-',
                'Grupo de Segurança (Security Group)': group.name || '-',
                'Nome do Utilizador (User Name)': member.userName || '-',
                'E-mail do Utilizador (User Email)': member.userEmail || '-',
                'Tipo de Permissão (Permission Type)': member.permissionType || '-',
                'Ticket do Jira (Jira Ticket)': member.jiraTicketUrl || '-',
                'Data de Atribuição (Assignment Date)': member.assignmentDate 
                  ? new Date(member.assignmentDate).toLocaleDateString('pt-PT') 
                  : '-'
              });
            }
          });
        } else {
          // If a group has no members, but matches group filter and no email filter is specified
          const groupFilter = exportGroup.trim().toLowerCase();
          const emailFilter = exportEmail.trim().toLowerCase();
          if (!emailFilter && (mode === 'complete' || !groupFilter || group.name.toLowerCase().includes(groupFilter))) {
            filteredData.push({
              'Empresa (Company)': group.company || '-',
              'Grupo de Segurança (Security Group)': group.name || '-',
              'Nome do Utilizador (User Name)': 'Nenhum utilizador associado',
              'E-mail do Utilizador (User Email)': '-',
              'Tipo de Permissão (Permission Type)': '-',
              'Ticket do Jira (Jira Ticket)': '-',
              'Data de Atribuição (Assignment Date)': '-'
            });
          }
        }
      });

      if (filteredData.length === 0) {
        alert("Sem dados correspondentes aos filtros de exportação configurados.");
        setIsExporting(false);
        return;
      }

      // Generate worksheet
      const ws = XLSX.utils.json_to_sheet(filteredData);

      // Define columns formatting and widths
      const cols = [
        { wch: 22 }, // Empresa
        { wch: 32 }, // Grupo de Segurança
        { wch: 28 }, // Nome do Utilizador
        { wch: 35 }, // E-mail do Utilizador
        { wch: 18 }, // Tipo de Permissão
        { wch: 45 }, // Ticket do Jira
        { wch: 18 }, // Data de Atribuição
      ];
      ws['!cols'] = cols;

      // Add Excel Auto-Filter property
      const totalRows = filteredData.length;
      ws['!autofilter'] = { ref: `A1:G${totalRows + 1}` };

      // Create workbook and append sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Controlo de Permissões');

      // Filename based on mode
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = mode === 'complete' 
        ? `Controlo_Permissoes_Completo_${dateStr}.xlsx` 
        : `Controlo_Permissoes_Filtrado_${dateStr}.xlsx`;

      // Write and trigger download
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      alert("Ocorreu um erro ao gerar o ficheiro Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Segment switcher */}
      <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm gap-1">
        <button
          onClick={() => setActiveSegment('current')}
          className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
            activeSegment === 'current'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Shield size={16} />
          Visualização & Exportação Geral
        </button>
        <button
          onClick={() => setActiveSegment('request')}
          className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
            activeSegment === 'request'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileSpreadsheet size={16} />
          Modelos e Formulários de Pedidos (Superiores)
        </button>
      </div>

      {activeSegment === 'request' ? (
        <PermissionFormGenerator />
      ) : (
        <>
          {/* Excel Export Configuration Box */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Exportar Controlo de Permissões para Excel</h2>
            <p className="text-xs text-gray-500">Gere e descarrega relatórios de permissões em formato Excel com filtros ativos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              E-mail do Utilizador
            </label>
            <input
              type="text"
              className="block w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
              placeholder="Ex: duarte.santos@moongy.pt"
              value={exportEmail}
              onChange={(e) => setExportEmail(e.target.value)}
            />
            <p className="text-[10px] text-gray-400 mt-1">Exportará apenas as permissões deste utilizador.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Nome do Grupo de Segurança
            </label>
            <input
              type="text"
              className="block w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
              placeholder="Ex: SG_Utilizadores"
              value={exportGroup}
              onChange={(e) => setExportGroup(e.target.value)}
            />
            <p className="text-[10px] text-gray-400 mt-1">Exportará apenas as permissões associadas a este grupo.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-gray-100">
          <button
            onClick={() => handleExportToExcel('filtered')}
            disabled={isExporting}
            className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-all duration-150 shadow-sm ${
              !exportEmail.trim() && !exportGroup.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-green-600 hover:bg-green-700 text-white hover:shadow cursor-pointer'
            }`}
          >
            <Download size={16} />
            Exportar com Filtros
          </button>

          <button
            onClick={() => handleExportToExcel('complete')}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-150 flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-gray-500" />
            Exportação Completa (Tudo)
          </button>

          {(exportEmail.trim() || exportGroup.trim()) && (
            <button
              onClick={() => {
                setExportEmail('');
                setExportGroup('');
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-150 cursor-pointer"
            >
              Limpar Campos
            </button>
          )}

          {isExporting && (
            <span className="text-xs text-gray-500 animate-pulse ml-auto">A gerar o ficheiro...</span>
          )}
        </div>
      </div>

      {/* Security Groups List Card */}
      <div className="bg-white rounded-lg shadow border border-gray-100">
      <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Pesquisar grupos ou utilizadores..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button 
            onClick={() => setSelectedCompany('ALL')}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${selectedCompany === 'ALL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todas
          </button>
          {Object.values(PermissionCompany).map(company => (
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
        {Object.entries(groupedByCompany).map(([company, groups]) => {
          const isExpanded = expandedCompanies[company];
          const allGroupsInCompanyCollapsed = groups.every(g => collapsedGroups[g.id]);
          
          return (
            <div key={company} className="border-b last:border-b-0 border-gray-200">
              <div
                onClick={() => toggleCompany(company)}
                className="w-full bg-gray-50 px-4 py-3 font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center justify-between border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {company} ({groups.length} Grupos)
                </div>
                
                <div className="flex items-center gap-3">
                  {isExpanded && groups.length > 1 && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="flex items-center gap-1 normal-case tracking-normal"
                    >
                      {allGroupsInCompanyCollapsed ? (
                        <button
                          type="button"
                          onClick={() => expandAllCompanyGroups(groups)}
                          className="text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50 flex items-center gap-1 shadow-sm"
                          title="Expandir todos os grupos desta empresa"
                        >
                          <ChevronsUpDown size={13} /> Expandir Grupos
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => collapseAllCompanyGroups(groups)}
                          className="text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50 flex items-center gap-1 shadow-sm"
                          title="Colapsar todos os grupos desta empresa"
                        >
                          <ChevronsDownUp size={13} /> Colapsar Grupos
                        </button>
                      )}
                    </div>
                  )}

                  {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-4 space-y-4 bg-gray-50/50">
                  {groups.map((group) => {
                    const isGroupCollapsed = !!collapsedGroups[group.id];

                    return (
                      <div key={group.id} className="border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm transition-all">
                        <div 
                          onClick={() => toggleGroupCollapse(group.id)}
                          className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white hover:bg-gray-50/80 cursor-pointer select-none transition-colors"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupCollapse(group.id);
                              }}
                              className="text-gray-500 hover:text-gray-800 p-0.5 rounded transition-colors"
                              title={isGroupCollapsed ? "Expandir utilizadores deste grupo" : "Colapsar utilizadores deste grupo"}
                            >
                              {isGroupCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            </button>

                            <Shield className="text-blue-600 shrink-0" size={19} />
                            <h3 className="text-base font-semibold text-gray-900 truncate">{group.name}</h3>
                            <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium shrink-0">
                              <Users size={12} />
                              {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(group);
                              }} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1 text-sm font-medium border border-transparent hover:border-blue-200" 
                            >
                              <Edit2 size={15} />
                              <span className="hidden sm:inline">Editar Grupo</span>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(group);
                              }} 
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200" 
                              title="Eliminar Grupo"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        
                        {!isGroupCollapsed && (
                          <div>
                            {group.members.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilizador</th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissão</th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Jira</th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {group.members.map((member) => (
                                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                          <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                                          <div className="text-sm text-gray-500">{member.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            member.permissionType === PermissionType.READ ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            {member.permissionType}
                                          </span>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                          {member.jiraTicketUrl ? (
                                            <a 
                                              href={member.jiraTicketUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                            >
                                              Ver Ticket <ExternalLink size={14} />
                                            </a>
                                          ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                          )}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                          {new Date(member.assignmentDate).toLocaleDateString('pt-PT')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-4 text-center text-gray-500 text-sm bg-gray-50">
                                Este grupo não tem utilizadores associados.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filteredGroups.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum grupo de segurança encontrado.
          </div>
        )}
      </div>
    </div>
    </>
    )}
    </div>
  );
};

export default PermissionList;

