import React, { useState, useEffect } from 'react';
import { SecurityGroupRecord, PermissionCompany, PermissionType, PermissionMember } from '../types';
import { X, Save, Plus, Trash2, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Search, User, Mail, Shield, Key } from 'lucide-react';
import { STATIC_SECURITY_GROUPS } from '../staticGroups';

interface PermissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: SecurityGroupRecord) => void;
  initialData?: SecurityGroupRecord | null;
}

const PermissionFormModal: React.FC<PermissionFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<SecurityGroupRecord>>({});
  const [isCustomGroup, setIsCustomGroup] = useState(false);
  const [collapsedMembers, setCollapsedMembers] = useState<Record<string, boolean>>({});
  const [memberFilter, setMemberFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
        const companyGroups = STATIC_SECURITY_GROUPS[initialData.company] || [];
        const existsInList = companyGroups.includes(initialData.name);
        setIsCustomGroup(!existsInList);
        
        // If there are many members (>3), collapse them by default for cleaner navigation
        if (initialData.members && initialData.members.length > 3) {
          const initialCollapsed: Record<string, boolean> = {};
          initialData.members.forEach(m => {
            initialCollapsed[m.id] = true;
          });
          setCollapsedMembers(initialCollapsed);
        } else {
          setCollapsedMembers({});
        }
      } else {
        setFormData({
          id: crypto.randomUUID(),
          name: '',
          company: PermissionCompany.AGAP2IT,
          members: []
        });
        setIsCustomGroup(false);
        setCollapsedMembers({});
      }
      setMemberFilter('');
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCompany = e.target.value as PermissionCompany;
    setFormData(prev => ({
      ...prev,
      company: newCompany,
      name: '' // reset name so they choose from the new company's list
    }));
    setIsCustomGroup(false);
  };

  const handleGroupNameSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomGroup(true);
      setFormData(prev => ({ ...prev, name: '' }));
    } else {
      setIsCustomGroup(false);
      setFormData(prev => ({ ...prev, name: val }));
    }
  };

  const toggleMemberCollapse = (memberId: string) => {
    setCollapsedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const collapseAllMembers = () => {
    if (!formData.members) return;
    const newCollapsed: Record<string, boolean> = {};
    formData.members.forEach(m => {
      newCollapsed[m.id] = true;
    });
    setCollapsedMembers(newCollapsed);
  };

  const expandAllMembers = () => {
    setCollapsedMembers({});
  };

  const handleAddMember = () => {
    const newMemberId = crypto.randomUUID();
    const newMember: PermissionMember = {
      id: newMemberId,
      userName: '',
      userEmail: '',
      permissionType: PermissionType.READ,
      jiraTicketUrl: '',
      assignmentDate: new Date().toISOString().split('T')[0]
    };
    
    // Ensure newly added member is expanded so the user can immediately type
    setCollapsedMembers(prev => ({
      ...prev,
      [newMemberId]: false
    }));

    setFormData(prev => ({
      ...prev,
      members: [...(prev.members || []), newMember]
    }));
  };

  const handleRemoveMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      members: (prev.members || []).filter(m => m.id !== memberId)
    }));
    setCollapsedMembers(prev => {
      const copy = { ...prev };
      delete copy[memberId];
      return copy;
    });
  };

  const handleMemberChange = (memberId: string, field: keyof PermissionMember, value: string) => {
    setFormData(prev => ({
      ...prev,
      members: (prev.members || []).map(m => 
        m.id === memberId ? { ...m, [field]: value } : m
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Por favor, selecione ou insira o nome do grupo de segurança.");
      return;
    }
    onSave(formData as SecurityGroupRecord);
    onClose();
  };

  if (!isOpen) return null;

  const currentCompany = formData.company || PermissionCompany.AGAP2IT;
  const companyGroups = STATIC_SECURITY_GROUPS[currentCompany] || [];

  const members = formData.members || [];
  const filteredMembers = members.filter(m => {
    if (!memberFilter.trim()) return true;
    const term = memberFilter.toLowerCase();
    return (
      (m.userName && m.userName.toLowerCase().includes(term)) ||
      (m.userEmail && m.userEmail.toLowerCase().includes(term)) ||
      (m.permissionType && m.permissionType.toLowerCase().includes(term)) ||
      (m.jiraTicketUrl && m.jiraTicketUrl.toLowerCase().includes(term))
    );
  });

  const totalMembers = members.length;
  const allCollapsed = totalMembers > 0 && members.every(m => collapsedMembers[m.id]);

  const inputClass = `mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {initialData ? 'Editar Grupo de Segurança' : 'Novo Grupo de Segurança'}
              </h2>
              <p className="text-xs text-gray-500">
                {totalMembers} {totalMembers === 1 ? 'utilizador associado' : 'utilizadores associados'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="permission-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Empresa *</label>
                <select 
                  name="company" 
                  value={formData.company} 
                  onChange={handleCompanyChange} 
                  className={inputClass}
                >
                  {Object.values(PermissionCompany).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Grupo de Segurança (Active Directory) *</label>
                <select
                  required={!isCustomGroup}
                  value={isCustomGroup ? '__custom__' : (formData.name || '')}
                  onChange={handleGroupNameSelect}
                  className={inputClass}
                >
                  <option value="" disabled>-- Selecione um grupo da empresa --</option>
                  {companyGroups.map(grp => (
                    <option key={grp} value={grp}>{grp}</option>
                  ))}
                  <option value="__custom__">Outro / Escrever Nome de Grupo...</option>
                </select>
              </div>

              {isCustomGroup && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Nome do Grupo de Segurança (Manual) *</label>
                  <input 
                    required 
                    name="name" 
                    value={formData.name || ''} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="Introduza o nome do grupo do Active Directory"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">Membros do Grupo</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {totalMembers}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {totalMembers > 1 && (
                    <div className="flex items-center gap-1">
                      {allCollapsed ? (
                        <button
                          type="button"
                          onClick={expandAllMembers}
                          className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-md font-medium transition-colors border border-gray-300 shadow-sm"
                          title="Expandir todos os utilizadores"
                        >
                          <ChevronsUpDown size={14} /> Expandir Todos
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={collapseAllMembers}
                          className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-md font-medium transition-colors border border-gray-300 shadow-sm"
                          title="Colapsar todos os utilizadores para poupar espaço"
                        >
                          <ChevronsDownUp size={14} /> Colapsar Todos
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="flex items-center gap-1.5 text-xs sm:text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm ml-auto sm:ml-0"
                  >
                    <Plus size={16} /> Adicionar Utilizador
                  </button>
                </div>
              </div>

              {/* Quick search filter if group has more than 3 members */}
              {totalMembers > 3 && (
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search size={15} />
                  </div>
                  <input
                    type="text"
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    placeholder="Filtrar utilizadores neste grupo por nome, e-mail ou permissão..."
                    className="block w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {memberFilter && (
                    <button
                      type="button"
                      onClick={() => setMemberFilter('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              )}

              {totalMembers === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm">Nenhum membro adicionado a este grupo.</p>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clique aqui para adicionar o primeiro membro
                  </button>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-sm">
                  Nenhum utilizador encontrado com o filtro &quot;{memberFilter}&quot;.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers.map((member, index) => {
                    const isCollapsed = !!collapsedMembers[member.id];
                    const realIndex = members.findIndex(m => m.id === member.id);

                    return (
                      <div 
                        key={member.id} 
                        className={`bg-white border rounded-lg transition-all duration-150 shadow-sm ${
                          isCollapsed ? 'border-gray-200 hover:border-gray-300' : 'border-blue-200 ring-1 ring-blue-100'
                        }`}
                      >
                        {/* Member Accordion Header */}
                        <div 
                          onClick={() => toggleMemberCollapse(member.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer select-none rounded-t-lg ${
                            isCollapsed ? 'bg-gray-50 hover:bg-gray-100 rounded-b-lg' : 'bg-blue-50/70 border-b border-blue-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMemberCollapse(member.id);
                              }}
                              className="text-gray-500 hover:text-gray-800 p-0.5 rounded transition-colors"
                              title={isCollapsed ? "Expandir detalhes" : "Colapsar detalhes"}
                            >
                              {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            </button>

                            <span className="text-xs font-bold text-gray-600 bg-white border border-gray-300 px-2 py-0.5 rounded shrink-0">
                              #{realIndex + 1}
                            </span>

                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {member.userName || <span className="text-gray-400 font-normal italic">(Sem nome definido)</span>}
                              </span>
                              {member.userEmail && (
                                <span className="text-xs text-gray-500 truncate hidden sm:inline">
                                  &lt;{member.userEmail}&gt;
                                </span>
                              )}
                            </div>

                            <span className={`ml-auto sm:ml-2 px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0 ${
                              member.permissionType === PermissionType.READ
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.permissionType || PermissionType.READ}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isCollapsed && member.assignmentDate && (
                              <span className="text-[11px] text-gray-500 hidden md:inline">
                                {new Date(member.assignmentDate).toLocaleDateString('pt-PT')}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMember(member.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
                              title="Remover Utilizador"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Member Form Fields (Expanded Body) */}
                        {!isCollapsed && (
                          <div className="p-4 bg-white rounded-b-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Nome do Utilizador *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={member.userName}
                                  onChange={(e) => handleMemberChange(member.id, 'userName', e.target.value)}
                                  className={inputClass}
                                  placeholder="Ex: João Silva"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Email Institucional *
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={member.userEmail}
                                  onChange={(e) => handleMemberChange(member.id, 'userEmail', e.target.value)}
                                  className={inputClass}
                                  placeholder="joao.silva@moongy.pt"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Tipo de Permissão *
                                </label>
                                <select
                                  required
                                  value={member.permissionType}
                                  onChange={(e) => handleMemberChange(member.id, 'permissionType', e.target.value)}
                                  className={inputClass}
                                >
                                  {Object.values(PermissionType).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="lg:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Ticket do Jira (ou Link do Pedido)
                                </label>
                                <input
                                  type="text"
                                  value={member.jiraTicketUrl}
                                  onChange={(e) => handleMemberChange(member.id, 'jiraTicketUrl', e.target.value)}
                                  className={inputClass}
                                  placeholder="https://jira.moongy.pt/browse/IT-123 ou TICKET-123"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Data de Atribuição *
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={member.assignmentDate}
                                  onChange={(e) => handleMemberChange(member.id, 'assignmentDate', e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500">
            {totalMembers > 0 && `${totalMembers} ${totalMembers === 1 ? 'membro configurado' : 'membros configurados'}`}
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm text-sm font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="permission-form"
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm text-sm font-semibold"
            >
              <Save size={18}/>
              Gravar Grupo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionFormModal;

