import React, { useState } from 'react';
import { LayoutDashboard, Monitor, PlusCircle, LogOut, User, Wifi, WifiOff, Laptop, Key, Home, Mail, Menu, X, Shield } from 'lucide-react';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  mainTab: string;
  onMainTabChange: (tab: string) => void;
  activeTab: 'dashboard' | 'rentals';
  onTabChange: (tab: 'dashboard' | 'rentals') => void;
  activeSubTab: 'dashboard' | 'list';
  onSubTabChange: (tab: 'dashboard' | 'list') => void;
  onNewRental: () => void;
  onNewAlugaRental: () => void;
  onNewSubscription: () => void;
  onNewMailbox: () => void;
  onNewPermission: () => void;
  user: UserProfile;
  onLogout: () => void;
  isOffline: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, mainTab, onMainTabChange, activeTab, onTabChange, activeSubTab, onSubTabChange, onNewRental, onNewAlugaRental, onNewSubscription, onNewMailbox, onNewPermission, user, onLogout, isOffline }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMainTabChange = (tab: string) => {
    onMainTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className={`${isOffline ? 'bg-gray-800' : 'bg-[#0078D4]'} text-white shadow-md transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-6">
            <button 
              className="md:hidden p-1 rounded-md hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="font-bold text-lg tracking-tight hidden sm:block">ITCS Management</div>
            <div className="font-bold text-lg tracking-tight sm:hidden">ITCS</div>
            
            {/* Main Tabs in Header */}
            <nav className="hidden md:flex space-x-4">
              <button
                onClick={() => onMainTabChange('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mainTab === 'home' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home size={16} />
                  Visão Geral
                </div>
              </button>
              <button
                onClick={() => onMainTabChange('mac-rentals')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mainTab === 'mac-rentals' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Laptop size={16} />
                  FUTURDATA Rentals
                </div>
              </button>
              <button
                onClick={() => onMainTabChange('aluga-rentals')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mainTab === 'aluga-rentals' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Laptop size={16} />
                  ALUGA Rentals
                </div>
              </button>
              <button
                onClick={() => onMainTabChange('subscriptions')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mainTab === 'subscriptions' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Key size={16} />
                  Gestão de Subscrições
                </div>
              </button>
              <button
                onClick={() => onMainTabChange('mailboxes')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mainTab === 'mailboxes' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  Listas & Mailboxes
                </div>
              </button>
              <button
                onClick={() => onMainTabChange('permissions')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mainTab === 'permissions' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  Permissões
                </div>
              </button>
            </nav>

            <div className={`hidden sm:flex items-center gap-1 text-xs px-2 py-0.5 rounded ${isOffline ? 'bg-yellow-600 text-white' : 'bg-blue-800 text-white'}`}>
               {isOffline ? <WifiOff size={12}/> : <Wifi size={12}/>}
               <span>{isOffline ? 'Offline Demo' : 'Connected'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
             <div className="flex items-center gap-2 text-sm opacity-90 border-r border-gray-400 pr-2 md:pr-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isOffline ? 'bg-gray-600 text-white' : 'bg-blue-100 text-[#0078D4]'}`}>
                    {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline">{user.name}</span>
             </div>
             <button 
                onClick={onLogout}
                className="text-white hover:text-blue-200 text-sm flex items-center gap-1"
                title="Sign Out"
             >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sair</span>
             </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#005a9e] px-2 pt-2 pb-3 space-y-1 shadow-inner">
            <button
              onClick={() => handleMainTabChange('home')}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                mainTab === 'home' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home size={18} />
                Visão Geral
              </div>
            </button>
            <button
              onClick={() => handleMainTabChange('mac-rentals')}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                mainTab === 'mac-rentals' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Laptop size={18} />
                FUTURDATAAC Rentals
              </div>
            </button>
            <button
              onClick={() => handleMainTabChange('aluga-rentals')}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                mainTab === 'aluga-rentals' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Laptop size={18} />
                ALUGA Rentals
              </div>
            </button>
            <button
              onClick={() => handleMainTabChange('subscriptions')}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                mainTab === 'subscriptions' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Key size={18} />
                Gestão de Subscrições
              </div>
            </button>
            <button
              onClick={() => handleMainTabChange('mailboxes')}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                mainTab === 'mailboxes' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail size={18} />
                Listas & Mailboxes
              </div>
            </button>
            <button
              onClick={() => handleMainTabChange('permissions')}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                mainTab === 'permissions' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield size={18} />
                Permissões
              </div>
            </button>
            <div className={`mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded ${isOffline ? 'bg-yellow-600 text-white' : 'bg-blue-800 text-white'}`}>
               {isOffline ? <WifiOff size={14}/> : <Wifi size={14}/>}
               <span>{isOffline ? 'Offline Demo' : 'Connected'}</span>
            </div>
          </div>
        )}
      </header>

      {/* Sub-header Navigation */}
      {mainTab === 'mac-rentals' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 sm:h-12 gap-2 sm:gap-0">
              <div className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => onTabChange('rentals')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'rentals'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Gerir Alugueres
                </button>
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={onNewRental}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Aluguer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'aluga-rentals' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 sm:h-12 gap-2 sm:gap-0">
              <div className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => onTabChange('rentals')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'rentals'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Gerir Alugueres
                </button>
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={onNewAlugaRental}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Aluguer ALUGA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'subscriptions' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 sm:h-12 gap-2 sm:gap-0">
              <div className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                <button
                  onClick={() => onSubTabChange('dashboard')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeSubTab === 'dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => onSubTabChange('list')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeSubTab === 'list'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Lista de Subscrições
                </button>
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={onNewSubscription}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Atribuir Licença
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'mailboxes' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 sm:h-12 gap-2 sm:gap-0">
              <div className="flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium text-gray-900 pb-1 sm:pb-0">
                <Mail className="mr-2 h-4 w-4" />
                Gestão de Listas e Mailboxes
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={onNewMailbox}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Registo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'permissions' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 sm:h-12 gap-2 sm:gap-0">
              <div className="flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium text-gray-900 pb-1 sm:pb-0">
                <Shield className="mr-2 h-4 w-4" />
                Controlo de Permissões
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={onNewPermission}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Permissão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {isOffline && activeTab === 'dashboard' && mainTab === 'mac-rentals' && (
           <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <WifiOff className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Está a visualizar a versão de <strong>Demonstração (Offline)</strong>. Os dados estão guardados apenas neste browser e não estão sincronizados com a base de dados.
                </p>
              </div>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;