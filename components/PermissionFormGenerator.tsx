import React, { useState } from 'react';
import { PermissionCompany } from '../types';
import { STATIC_SECURITY_GROUPS } from '../staticGroups';
import { FileSpreadsheet, Download, Trash2, Sparkles, User, Mail, BookmarkCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

const PermissionFormGenerator: React.FC = () => {
  // Recipient details
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Clean form
  const handleClear = () => {
    setRecipientName('');
    setRecipientEmail('');
  };

  // Export to Excel trigger
  const exportToExcel = () => {
    if (!recipientName.trim() || !recipientEmail.trim()) {
      alert("Por favor, preencha o Nome e E-mail da pessoa que vai receber as permissões antes de exportar.");
      return;
    }

    try {
      const dateStr = new Date().toLocaleDateString('pt-PT');
      
      // Building workbook sheet rows
      const sheetRows: any[][] = [
        ["FORMULÁRIO DE PEDIDO E ATRIBUÇÃO DE PERMISSÕES DE ACESSO"],
        [],
        ["DADOS DO UTILIZADOR / BENEFICIÁRIO"],
        ["Nome Completo:", recipientName.trim()],
        ["E-mail Institucional:", recipientEmail.trim()],
        ["Data do Pedido:", dateStr],
        [],
        ["INSTRUÇÕES PARA O SUPERIOR HIERÁRQUICO (APROVADOR):"],
        ["1. Analise os grupos de rede (Active Directory) listados na tabela abaixo, organizados por empresa."],
        ["2. Caso pretenda autorizar o acesso a um grupo, verifique/preencha a coluna 'Atribuir Acesso? (X)' com um 'X'."],
        ["3. Escolha o 'Nível de Permissão' pretendido na coluna correspondente, assinalando 'Somente Leitura' ou 'Escrita'."],
        ["4. Forneça uma breve justificação ou nota na coluna 'Notas / Motivo do Acesso' se necessário."],
        ["5. Preencha o seu nome completo e data de aprovação, e envie este documento validado por e-mail ao administrador de sistemas."],
        [],
        ["TABELA DE GRUPOS E PERMISSÕES DO BENEFICIÁRIO"],
        ["Empresa", "Grupo de Segurança (Active Directory)", "Atribuir Acesso? (X)", "Nível de Permissão Pretendido", "Notas / Motivo do Acesso"]
      ];

      // Add all groups segmented by companies
      const allCompanies = Object.values(PermissionCompany);
      
      allCompanies.forEach(comp => {
        const groups = STATIC_SECURITY_GROUPS[comp] || [];
        groups.forEach(groupName => {
          sheetRows.push([
            comp,
            groupName,
            "", // Empty for the approver to tick
            "", // Empty for the approver to select Leitura/Escrita
            ""  // Empty for the approver's notes
          ]);
        });
      });

      // Add approval fields in the footer
      sheetRows.push([]);
      sheetRows.push([]);
      sheetRows.push(["VALIDAÇÃO DO SUPERIOR HIERÁRQUICO / RESPONSÁVEL"]);
      sheetRows.push(["Nome do Aprovador:", "______________________________________________________"]);
      sheetRows.push(["Assinatura / Parecer:", "Aprovado e autorizado pelo Superior Hierárquico"]);
      sheetRows.push(["Data da Validação:", "____ / ____ / 2026"]);

      // Create Worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);

      // Styles & Width adjustments
      const cols = [
        { wch: 22 }, // Empresa
        { wch: 62 }, // Grupo de Segurança
        { wch: 18 }, // Atribuir Acesso
        { wch: 28 }, // Nível de Permissão
        { wch: 45 }, // Notas / Motivo do Acesso
      ];
      ws['!cols'] = cols;

      // Enable Autofilter for the table (starting at table headers row, 16th row, index 15)
      const lastRowIdx = sheetRows.length - 6; // before the signature section
      ws['!autofilter'] = { ref: `A16:E${lastRowIdx}` };

      // Create Workbook and append sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pedido de Permissoes');

      // Filename
      const cleanName = recipientName.trim().replace(/\s+/g, '_');
      const filename = `Formulario_Permissoes_${cleanName}_2026.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Erro ao gerar formulário Excel:", error);
      alert("Ocorreu um erro ao gerar o ficheiro de formulário Excel.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
      {/* Banner styling: soft aesthetic violet header */}
      <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-700 text-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-violet-500/30 border border-violet-400/30 text-violet-100 mb-2">
              Utilitário de Segurança
            </span>
            <h2 className="text-xl font-bold tracking-tight">Formulário de Atribuição de Permissões</h2>
            <p className="text-sm text-violet-100/90 mt-1 max-w-2xl">
              Gere e transfira um formulário Excel com a listagem integral de todos os grupos de segurança organizados por empresa, pronto para envio e preenchimento manual do gestor aprovador.
            </p>
          </div>
          <div className="hidden lg:block p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
            <Sparkles size={24} className="text-yellow-300" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Recipient Details Card */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <BookmarkCheck size={18} className="text-indigo-600" />
            Passo Único: Identificar o Utilizador Recebedor das Permissões
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                Nome do Colaborador *
              </label>
              <div className="relative block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Duarte Silva"
                  className="block w-full pl-9 pr-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                E-mail do Colaborador *
              </label>
              <div className="relative block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Ex: joao.silva@agap2.pt"
                  className="block w-full pl-9 pr-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Download action footer bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            * O ficheiro Excel gerado (.xlsx) listará todas as empresas e respetivos grupos num formato otimizado com auto-filtros e uma seção de assinatura de parecer para aprovação rápida de superiores.
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleClear}
              type="button"
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-md transition-all duration-150 flex items-center gap-2 cursor-pointer grow sm:grow-0 justify-center shadow-sm"
            >
              <Trash2 size={16} />
              Limpar Campos
            </button>

            <button
              onClick={exportToExcel}
              disabled={!recipientName.trim() || !recipientEmail.trim()}
              type="button"
              className={`px-5 py-2 text-sm font-semibold rounded-md flex items-center gap-2 shadow transition-all duration-150 grow sm:grow-0 justify-center hover:shadow bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer ${
                (!recipientName.trim() || !recipientEmail.trim()) && 'opacity-50 cursor-not-allowed bg-indigo-400'
              }`}
            >
              <Download size={18} />
              Gerar & Descarregar Formulário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionFormGenerator;
