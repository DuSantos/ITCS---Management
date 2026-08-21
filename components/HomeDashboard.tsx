import React from 'react';
import { Asset, Subscription, SubscriptionType, Mailbox, MailboxType, DistributionListType } from '../types';
import { AlertCircle, CheckCircle2, Laptop, Key, Users, BookOpen, Mail, Activity } from 'lucide-react';

interface HomeDashboardProps {
  assets: Asset[];
  alugaRentals: Asset[];
  subscriptions: Subscription[];
  mailboxes: Mailbox[];
  onNavigateToRentals: () => void;
  onNavigateToAlugaRentals: () => void;
  onNavigateToSubscriptions: () => void;
  onNavigateToMailboxes: () => void;
  onNavigateToAsset: (asset: Asset, type: 'mac' | 'aluga') => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
  assets, 
  alugaRentals, 
  subscriptions, 
  mailboxes, 
  onNavigateToRentals, 
  onNavigateToAlugaRentals, 
  onNavigateToSubscriptions, 
  onNavigateToMailboxes,
  onNavigateToAsset
}) => {
  // Calculate expiring assets (within 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const expiringAssets = assets.filter(asset => {
    if (!asset.endDate) return false;
    const isUnderRenewal = asset.renewalChecklist && asset.renewalChecklist.some(c => !c);
    if (isUnderRenewal) return false;
    const endDate = new Date(asset.endDate);
    return endDate <= thirtyDaysFromNow && asset.status === 'Em Produção';
  });

  const expiringAluga = alugaRentals.filter(asset => {
    if (!asset.endDate) return false;
    const isUnderRenewal = asset.renewalChecklist && asset.renewalChecklist.some(c => !c);
    if (isUnderRenewal) return false;
    const endDate = new Date(asset.endDate);
    return endDate <= thirtyDaysFromNow && asset.status === 'Em Produção';
  });

  // Calculate subscriptions
  const activeSubscriptions = subscriptions.filter(s => !s.project?.toLowerCase().includes('no license'));
  const totalM365 = activeSubscriptions.filter(s => s.type === SubscriptionType.M365_APPS).length;
  const totalCopilot = activeSubscriptions.filter(s => s.type === SubscriptionType.COPILOT).length;
  const totalVS = activeSubscriptions.filter(s => s.type === SubscriptionType.VISUAL_STUDIO).length;
  const totalClaude = activeSubscriptions.filter(s => s.type === SubscriptionType.CLAUDE_AI).length;

  // Calculate mailboxes
  const totalSharedMailboxes = mailboxes.filter(m => m.type === MailboxType.SHARED_MAILBOX).length;
  const totalDistributionLists = mailboxes.filter(m => m.type === MailboxType.DISTRIBUTION_LIST).length;
  const totalDynamic = mailboxes.filter(m => m.type === MailboxType.DISTRIBUTION_LIST && m.distributionType === DistributionListType.DYNAMIC).length;
  const totalAssigned = mailboxes.filter(m => m.type === MailboxType.DISTRIBUTION_LIST && m.distributionType === DistributionListType.ASSIGNED).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Mac Rentals Status */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Laptop className="text-blue-600" size={20} />
              FUTURDATA Rentals
            </h3>
            <button 
              onClick={onNavigateToRentals}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver &rarr;
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center p-2 text-center">
            {expiringAssets.length > 0 ? (
              <div className="flex-1 flex flex-col w-full text-center">
                <button
                  onClick={() => onNavigateToAsset(expiringAssets[0], 'mac')}
                  className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm border border-red-200"
                  title="Clicar para ver equipamentos com atenção no inventário"
                >
                  <AlertCircle className="text-red-600 animate-pulse" size={24} />
                </button>
                <h4 className="text-sm font-bold text-gray-900 mb-1">Atenção</h4>
                <p className="text-xs text-gray-600 mb-3">
                  <strong className="text-red-600">{expiringAssets.length}</strong> {expiringAssets.length === 1 ? 'equipamento' : 'equipamentos'} a expirar em 30d.
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-left w-full mt-1 border-t border-gray-100 pt-3">
                  {expiringAssets.map(asset => {
                    const endDate = new Date(asset.endDate);
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
                    return (
                      <button
                        key={asset.id}
                        onClick={() => onNavigateToAsset(asset, 'mac')}
                        className="w-full text-xs p-2.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-gray-850 transition-all active:translate-y-px flex flex-col gap-1 cursor-pointer text-left shadow-sm hover:shadow-md"
                        title={`Clique para ir para o equipamento de ${asset.consultantName}`}
                      >
                        <span className="font-semibold text-gray-900 truncate flex justify-between items-center gap-1.5">
                          <span className="truncate">{asset.consultantName}</span>
                          <span className="text-[10px] bg-red-200 text-red-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {diffDays <= 0 ? 'Expirado' : `${diffDays}d`}
                          </span>
                        </span>
                        <span className="text-gray-500 truncate text-[11px] font-mono">{asset.serialNumber}</span>
                        <span className="text-gray-600 truncate text-[11px]">{asset.equipmentSpecs}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">OK</h4>
                <p className="text-xs text-gray-600">Sem expirações em 30d.</p>
              </>
            )}
          </div>
        </div>

        {/* ALUGA Rentals Status */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Laptop className="text-orange-600" size={20} />
              ALUGA Rentals
            </h3>
            <button 
              onClick={onNavigateToAlugaRentals}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver &rarr;
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center p-2 text-center">
            {expiringAluga.length > 0 ? (
              <div className="flex-1 flex flex-col w-full text-center">
                <button
                  onClick={() => onNavigateToAsset(expiringAluga[0], 'aluga')}
                  className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm border border-red-200"
                  title="Clicar para ver equipamentos com atenção no inventário da ALUGA"
                >
                  <AlertCircle className="text-red-600 animate-pulse" size={24} />
                </button>
                <h4 className="text-sm font-bold text-gray-900 mb-1">Atenção</h4>
                <p className="text-xs text-gray-600 mb-3">
                  <strong className="text-red-600">{expiringAluga.length}</strong> {expiringAluga.length === 1 ? 'equipamento' : 'equipamentos'} a expirar em 30d.
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-left w-full mt-1 border-t border-gray-100 pt-3">
                  {expiringAluga.map(asset => {
                    const endDate = new Date(asset.endDate);
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
                    return (
                      <button
                        key={asset.id}
                        onClick={() => onNavigateToAsset(asset, 'aluga')}
                        className="w-full text-xs p-2.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-gray-850 transition-all active:translate-y-px flex flex-col gap-1 cursor-pointer text-left shadow-sm hover:shadow-md"
                        title={`Clique para ir para o equipamento de ${asset.consultantName}`}
                      >
                        <span className="font-semibold text-gray-900 truncate flex justify-between items-center gap-1.5">
                          <span className="truncate">{asset.consultantName}</span>
                          <span className="text-[10px] bg-red-200 text-red-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {diffDays <= 0 ? 'Expirado' : `${diffDays}d`}
                          </span>
                        </span>
                        <span className="text-gray-500 truncate text-[11px] font-mono">{asset.serialNumber}</span>
                        <span className="text-gray-600 truncate text-[11px]">{asset.equipmentSpecs}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">OK</h4>
                <p className="text-xs text-gray-600">Sem expirações em 30d.</p>
              </>
            )}
          </div>
        </div>

        {/* Subscriptions Status */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Key className="text-purple-600" size={20} />
              Licenças Atribuídas
            </h3>
            <button 
              onClick={onNavigateToSubscriptions}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Gerir Licenças &rarr;
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                  <BookOpen size={20} />
                </div>
                <span className="font-medium text-gray-700">Microsoft 365 Apps</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{totalM365}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-md">
                  <Users size={20} />
                </div>
                <span className="font-medium text-gray-700">Microsoft Copilot 365</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{totalCopilot}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                  <Activity size={20} />
                </div>
                <span className="font-medium text-gray-700">Claude AI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{totalClaude}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-md">
                  <Key size={20} />
                </div>
                <span className="font-medium text-gray-700">Microsoft Visual Studio</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{totalVS}</span>
            </div>
          </div>
        </div>

        {/* Mailboxes Status */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Mail className="text-emerald-600" size={20} />
              Listas e Mailboxes
            </h3>
            <button 
              onClick={onNavigateToMailboxes}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Gerir Listas &rarr;
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                  <Mail size={20} />
                </div>
                <span className="font-medium text-gray-700">Shared Mailboxes</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{totalSharedMailboxes}</span>
            </div>
            
            <div className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 text-teal-600 rounded-md">
                    <Users size={20} />
                  </div>
                  <span className="font-medium text-gray-700">Listas de Distribuição</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{totalDistributionLists}</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Dinâmicas: <span className="font-semibold text-gray-900">{totalDynamic}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Assigned: <span className="font-semibold text-gray-900">{totalAssigned}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
