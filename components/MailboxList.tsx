import React, { useState } from 'react';
import { Mailbox, MailboxType, DistributionListType } from '../types';
import { Edit2, Search, Trash2, Mail, Users } from 'lucide-react';

interface MailboxListProps {
  mailboxes: Mailbox[];
  onEdit: (mailbox: Mailbox) => void;
  onDelete: (mailbox: Mailbox) => void;
}

const MailboxList: React.FC<MailboxListProps> = ({ mailboxes, onEdit, onDelete }) => {
  const [filterText, setFilterText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredMailboxes = mailboxes.filter(mb => {
    const matchesText = 
      mb.displayName.toLowerCase().includes(filterText.toLowerCase()) ||
      mb.email.toLowerCase().includes(filterText.toLowerCase()) ||
      mb.requestedBy.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesType = selectedType === 'ALL' || mb.type === selectedType;

    return matchesText && matchesType;
  });

  const groupedMailboxes = selectedType === 'ALL' 
    ? Object.values(MailboxType).reduce((acc, type) => {
        const typeMbs = filteredMailboxes.filter(m => m.type === type);
        if (typeMbs.length > 0) acc[type] = typeMbs;
        return acc;
      }, {} as Record<string, Mailbox[]>)
    : { [selectedType]: filteredMailboxes };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100">
      <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
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
          {Object.values(MailboxType).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 ${selectedType === type ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {type === MailboxType.SHARED_MAILBOX ? <Mail size={14} /> : <Users size={14} />}
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {Object.entries(groupedMailboxes).map(([type, list]) => (
          <div key={type} className="border-b last:border-b-0 border-gray-200">
            <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${type === MailboxType.SHARED_MAILBOX ? 'bg-purple-500' : 'bg-green-500'}`}></span>
              {type} ({list.length})
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name / Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requerente / Data</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {type === MailboxType.SHARED_MAILBOX ? 'Delegada a' : 'Membros'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jira Ticket</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map((mb) => (
                  <tr key={mb.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {mb.displayName}
                        {mb.type === MailboxType.DISTRIBUTION_LIST && mb.distributionType && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            {mb.distributionType}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{mb.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mb.requestedBy}</div>
                      <div className="text-xs text-gray-500">{new Date(mb.creationDate).toLocaleDateString('pt-PT')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                        {mb.type === MailboxType.SHARED_MAILBOX && mb.delegatedTo && mb.delegatedTo.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {mb.delegatedTo.map((member, idx) => (
                              <li key={idx} className="text-xs">
                                <span className="font-medium">{member.name}</span> <span className="text-gray-500">({member.email})</span>
                              </li>
                            ))}
                          </ul>
                        ) : mb.type === MailboxType.DISTRIBUTION_LIST && mb.members && mb.members.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {mb.members.map((member, idx) => (
                              <li key={idx} className="text-xs">
                                <span className="font-medium">{member.name}</span> <span className="text-gray-500">({member.email})</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Nenhum registo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={mb.jiraTicketUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        Ver Ticket
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => onEdit(mb)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDelete(mb)} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {filteredMailboxes.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum registo encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default MailboxList;
