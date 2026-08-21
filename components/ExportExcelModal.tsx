import React, { useState } from 'react';
import { Asset, Company, AssetStatus } from '../types';
import { X, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  type?: 'mac' | 'aluga';
}

const ExportExcelModal: React.FC<ExportExcelModalProps> = ({ 
  isOpen, 
  onClose, 
  assets, 
  type = 'mac' 
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'production' | 'renew' | 'returned'>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFilename, setExportedFilename] = useState<string | null>(null);

  if (!isOpen) return null;

  const getDaysRemaining = (endDateStr?: string): number => {
    if (!endDateStr) return 9999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isUnderRenewal = (asset: Asset): boolean => {
    return !!(asset.renewalChecklist && asset.renewalChecklist.some(c => !c));
  };

  // 1. Filter original assets list based on choice
  const filteredAssets = assets.filter(asset => {
    // Company match
    const companyMatch = selectedCompany === 'ALL' || asset.company === selectedCompany;
    if (!companyMatch) return false;

    // Status match
    if (statusFilter === 'all') return true;
    if (statusFilter === 'production') return asset.status === 'Em Produção' && !isUnderRenewal(asset);
    if (statusFilter === 'returned') return asset.status === 'Devolvido';
    if (statusFilter === 'renew') {
      if (!asset.endDate) return isUnderRenewal(asset);
      const days = getDaysRemaining(asset.endDate);
      const isExpiringSoon = asset.status === 'Em Produção' && days <= 30;
      return isUnderRenewal(asset) || isExpiringSoon;
    }
    return true;
  });

  const handleExport = () => {
    setIsExporting(true);
    setExportedFilename(null);

    try {
      const wb = XLSX.utils.book_new();
      const displayName = type === 'mac' ? 'FUTURDATA' : 'ALUGA';
      const fileLabel = type === 'mac' ? 'futurdata_rentals' : 'aluga_rentals';

      // 2. Prepare metadata & summary sheet if exporting "ALL" companies
      const summaryRows = [];
      let grandTotalCount = 0;
      let grandTotalCostEx = 0;
      let grandTotalCostInc = 0;

      const getNum = (val: any): number => {
        if (typeof val === 'number') {
          return isNaN(val) ? 0 : val;
        }
        if (typeof val === 'string') {
          // Replace European comma decimals with standard dots, then strip everything except numbers, dots, and minus signs
          const clean = val.replace(',', '.').replace(/[^\d.-]/g, '');
          const parsed = parseFloat(clean);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      const companyStats = Object.values(Company).map(company => {
        const compAssets = filteredAssets.filter(a => a.company === company);
        const count = compAssets.length;
        const totalEx = compAssets.reduce((sum, a) => sum + getNum(a.monthlyValueExvat), 0);
        const totalInc = compAssets.reduce((sum, a) => sum + getNum(a.monthlyValueIncVat), 0);

        grandTotalCount += count;
        grandTotalCostEx += totalEx;
        grandTotalCostInc += totalInc;

        return {
          'Empresa': company,
          'Equipamentos': count,
          'Custo Mensal S/ IVA (€)': Number(totalEx.toFixed(2)),
          'Custo Mensal C/ IVA (€)': Number(totalInc.toFixed(2)),
        };
      });

      // Append summary entries
      companyStats.forEach(stat => {
        const percent = filteredAssets.length > 0 
          ? Number(((stat['Equipamentos'] / filteredAssets.length) * 100).toFixed(1)) 
          : 0;
        summaryRows.push({
          ...stat,
          'Percentagem do Inventário': `${percent}%`
        });
      });

      // Add Total Row to Summary
      summaryRows.push({
        'Empresa': 'TOTAL GERAL',
        'Equipamentos': grandTotalCount,
        'Custo Mensal S/ IVA (€)': Number(grandTotalCostEx.toFixed(2)),
        'Custo Mensal C/ IVA (€)': Number(grandTotalCostInc.toFixed(2)),
        'Percentagem do Inventário': '100%'
      });

      // Create Worksheet for SUMMARY
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      
      // Auto-fit column widths helper
      const fitWidths = (rows: any[]) => {
        if (!rows || rows.length === 0) return [];
        const keys = Object.keys(rows[0]);
        return keys.map(key => {
          let maxLen = key.toString().length;
          rows.forEach(r => {
            const val = r[key];
            if (val !== undefined && val !== null) {
              const strLen = val.toString().length;
              if (strLen > maxLen) {
                maxLen = strLen;
              }
            }
          });
          return { wch: Math.min(maxLen + 3, 50) };
        });
      };

      wsSummary['!cols'] = fitWidths(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo do Inventário');

      // 3. Prepare list of items
      const createAssetRow = (asset: Asset, index: number) => {
        const days = getDaysRemaining(asset.endDate);
        const underRenewal = isUnderRenewal(asset);
        
        let customStatus = asset.status;
        if (underRenewal) {
          customStatus = 'Pendente / Em Renovação' as AssetStatus;
        } else if (asset.status === 'Em Produção') {
          if (!asset.endDate) {
            customStatus = 'Em Produção (Renovação Automática)' as AssetStatus;
          } else if (days <= 0) {
            customStatus = 'Contrato Expirado' as AssetStatus;
          } else if (days <= 30) {
            customStatus = 'A Expirar brevemente' as AssetStatus;
          }
        }

        return {
          '#': index + 1,
          'Consultor': asset.consultantName || 'N/A',
          'Manager/Responsável': asset.managerName || 'N/A',
          'Projeto': asset.project || 'N/A',
          'Empresa': asset.company || 'N/A',
          'Equipamento/Especificações': asset.equipmentSpecs || 'N/A',
          'Número de Série (S/N)': asset.serialNumber || 'N/A',
          'Número da Proposta': asset.proposalNumber || 'N/A',
          'Número de PO': asset.poNumber || 'N/A',
          'Data de Início': asset.startDate ? new Date(asset.startDate).toLocaleDateString('pt-PT') : 'N/A',
          'Data de Fim': asset.endDate ? new Date(asset.endDate).toLocaleDateString('pt-PT') : 'Renovação Automática',
          'Dias Restantes': asset.status === 'Em Produção' ? (asset.endDate ? days : 'N/A') : 'N/A',
          'Meses de Duração': asset.durationMonths || 'N/A',
          'Valor Mensal S/ IVA (€)': asset.monthlyValueExvat || 0,
          'Valor Mensal C/ IVA (€)': asset.monthlyValueIncVat || 0,
          'Estado/Fase': customStatus,
          'Localização': asset.location || 'N/A',
          'Observações/Notas': asset.observations || 'N/A',
        };
      };

      // General/Full sheet
      const flatRows = filteredAssets.map((asset, index) => createAssetRow(asset, index));
      const wsGeral = XLSX.utils.json_to_sheet(flatRows);
      wsGeral['!cols'] = fitWidths(flatRows);
      XLSX.utils.book_append_sheet(wb, wsGeral, 'Todos os Equipamentos');

      // 4. Create individual sheets per Company (if filtering for ALL, otherwise just show filtered company sheet)
      if (selectedCompany === 'ALL') {
        Object.values(Company).forEach(company => {
          const compAssets = filteredAssets.filter(a => a.company === company);
          if (compAssets.length > 0) {
            const compRows = compAssets.map((asset, index) => createAssetRow(asset, index));
            const wsComp = XLSX.utils.json_to_sheet(compRows);
            wsComp['!cols'] = fitWidths(compRows);
            // Sheet name max length in Excel is 31 characters
            const sheetName = company.substring(0, 31);
            XLSX.utils.book_append_sheet(wb, wsComp, sheetName);
          }
        });
      }

      // Generate actual download
      const todayString = new Date().toISOString().split('T')[0];
      const selectedStatusLabel = 
        statusFilter === 'all' ? 'todos' :
        statusFilter === 'production' ? 'em_producao' :
        statusFilter === 'renew' ? 'a_renovar' : 'devolvidos';

      const filename = `relatorio_${fileLabel}_${selectedStatusLabel}_${todayString}.xlsx`;
      
      XLSX.writeFile(wb, filename);
      setExportedFilename(filename);

      // Brief visual completion feedback
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);

    } catch (err) {
      console.error('Erro ao gerar ficheiro Excel:', err);
      setIsExporting(false);
      alert('Erro ao exportar excel. Verifique se os dados estão completos.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" size={22} />
            Exportar {type === 'mac' ? 'FUTURDATA Rentals' : 'ALUGA Rentals'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 p-1.5 rounded-full border border-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600">
            Configure as opções abaixo para gerar e descarregar um relatório avançado em formato Excel (.xlsx). O ficheiro incluirá uma página de <strong>Resumo Financeiro e Distribuição</strong> por empresa, uma listagem geral dos registos e separadores individuais por empresa.
          </p>

          {/* Company filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Empresa
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCompany('ALL')}
                className={`py-2 px-3 text-sm border rounded-md font-medium transition-all ${
                  selectedCompany === 'ALL'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                Todas (Total Geral)
              </button>
              {Object.values(Company).map(company => (
                <button
                  key={company}
                  type="button"
                  onClick={() => setSelectedCompany(company)}
                  className={`py-2 px-3 text-sm border rounded-md font-medium transition-all truncate ${
                    selectedCompany === company
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                  title={company}
                >
                  {company}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado / Filtro de Produção
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                <input
                  type="radio"
                  name="exportStatus"
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  checked={statusFilter === 'all'}
                  onChange={() => setStatusFilter('all')}
                />
                <div className="text-sm">
                  <span className="font-semibold text-gray-800 block">Todos os Registos</span>
                  <span className="text-xs text-gray-500">Exporta todo o inventário atual para o Excel (em Produção, Devolvidos, Stock).</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                <input
                  type="radio"
                  name="exportStatus"
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  checked={statusFilter === 'production'}
                  onChange={() => setStatusFilter('production')}
                />
                <div className="text-sm">
                  <span className="font-semibold text-gray-800 block">Apenas ativos "Em Produção"</span>
                  <span className="text-xs text-gray-500">Exclui equipamentos devolvidos, em stock ou que estão com renovação pendente.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                <input
                  type="radio"
                  name="exportStatus"
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  checked={statusFilter === 'renew'}
                  onChange={() => setStatusFilter('renew')}
                />
                <div className="text-sm">
                  <span className="font-semibold text-purple-800 block flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                    Apenas "Têm de ser Renovados"
                  </span>
                  <span className="text-xs text-gray-500">Filtra apenas equipamentos com tarefas de renovação pendentes e/ou cujo contrato termina nos próximos 30 dias.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                <input
                  type="radio"
                  name="exportStatus"
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  checked={statusFilter === 'returned'}
                  onChange={() => setStatusFilter('returned')}
                />
                <div className="text-sm">
                  <span className="font-semibold text-gray-800 block">Apenas "Devolvidos"</span>
                  <span className="text-xs text-gray-500">Filtra apenas contratos concluídos onde o equipamento já foi de facto devolvido.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Selected stats preview */}
          <div className="bg-emerald-50 rounded-lg p-3.5 border border-emerald-100 text-sm flex gap-3 text-emerald-950 items-center">
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
            <div>
              <p className="font-medium">Pronto a exportar:</p>
              <p className="text-xs opacity-90 mt-0.5">
                Encontrados <strong>{filteredAssets.length}</strong> registos de <strong>{selectedCompany === 'ALL' ? 'todas as empresas' : selectedCompany}</strong> com o estado selecionado.
              </p>
            </div>
          </div>

          {exportedFilename && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-900 flex items-center gap-2">
              <Download size={14} className="text-blue-600" />
              <span>O ficheiro <strong>{exportedFilename}</strong> foi descarregado com sucesso!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-all text-sm"
          >
            Fechar
          </button>
          <button 
            type="button"
            onClick={handleExport}
            disabled={filteredAssets.length === 0 || isExporting}
            className={`px-5 py-2 text-white rounded-md font-semibold text-sm shadow-sm flex items-center gap-2 transition-all ${
              filteredAssets.length === 0
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow active:scale-95'
            }`}
          >
            <Download size={16} />
            {isExporting ? 'A Exportar...' : 'Transferir Relatório Excel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportExcelModal;
