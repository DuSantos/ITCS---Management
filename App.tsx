import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import AssetFormModal from './components/AssetFormModal';
import EmailGeneratorModal from './components/EmailGeneratorModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import SubscriptionList from './components/SubscriptionList';
import SubscriptionFormModal from './components/SubscriptionFormModal';
import SubscriptionDashboard from './components/SubscriptionDashboard';
import HomeDashboard from './components/HomeDashboard';
import MailboxList from './components/MailboxList';
import MailboxFormModal from './components/MailboxFormModal';
import PermissionList from './components/PermissionList';
import PermissionFormModal from './components/PermissionFormModal';
import LoginPage from './components/LoginPage';
import { Asset, UserProfile, Subscription, Mailbox, SecurityGroupRecord } from './types';
import { getAssets, saveAsset, deleteAsset, getSubscriptions, saveSubscription, deleteSubscription, getMailboxes, saveMailbox, deleteMailbox, getSecurityGroups, saveSecurityGroup, deleteSecurityGroup, getAlugaRentals, saveAlugaRental, deleteAlugaRental } from './services/storageService';
import { PlusCircle } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [mainTab, setMainTab] = useState<string>('home');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rentals'>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'list'>('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [alugaRentals, setAlugaRentals] = useState<Asset[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [securityGroups, setSecurityGroups] = useState<SecurityGroupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Shared Filter States for AssetList
  const [macFilterText, setMacFilterText] = useState('');
  const [alugaFilterText, setAlugaFilterText] = useState('');
  const [macSelectedCompany, setMacSelectedCompany] = useState('ALL');
  const [alugaSelectedCompany, setAlugaSelectedCompany] = useState('ALL');
  
  // Asset Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'renew' | 'view'>('create');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [currentRentalType, setCurrentRentalType] = useState<'mac' | 'aluga'>('mac');

  // Email Generator Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAsset, setEmailAsset] = useState<Asset | null>(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Subscription State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Mailbox State
  const [isMailboxModalOpen, setIsMailboxModalOpen] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState<Mailbox | null>(null);

  // Permission State
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedSecurityGroup, setSelectedSecurityGroup] = useState<SecurityGroupRecord | null>(null);

  // Load data on mount or when user authenticates
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ 
          name: firebaseUser.displayName || firebaseUser.email || 'User', 
          email: firebaseUser.email || '' 
        });
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAuthReady) {
      refreshData();
    }
  }, [user, isAuthReady]);

  // Ref to log tracking of processed emails in local session memory
  const processedNotificationsRef = React.useRef<Set<string>>(new Set());

  // Sweep and send automatic notifications to ITCS for both Macs and Aluga rentals with contracts ending soon
  useEffect(() => {
    if (!user || (assets.length === 0 && alugaRentals.length === 0)) return;

    const checkAndNotifyExpiringRentals = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

      // 1. Process regular MAC assets
      const expiringUnnotifiedMacs = assets.filter(asset => {
        if (!asset.endDate) return false;
        if (asset.status !== 'Em Produção') return false;
        if (asset.itcsNotified) return false;
        if (processedNotificationsRef.current.has(asset.id)) return false;

        const endDate = new Date(asset.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate <= thirtyDaysFromNow && endDate >= sixtyDaysAgo;
      });

      // 2. Process Aluga rentals
      const expiringUnnotifiedAluga = alugaRentals.filter(asset => {
        if (!asset.endDate) return false;
        if (asset.status !== 'Em Produção') return false;
        if (asset.itcsNotified) return false;
        if (processedNotificationsRef.current.has(asset.id)) return false;

        const endDate = new Date(asset.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate <= thirtyDaysFromNow && endDate >= sixtyDaysAgo;
      });

      // Combine them for execution logic, but track which is what
      const targets = [
        ...expiringUnnotifiedMacs.map(a => ({ asset: a, type: 'mac' as const })),
        ...expiringUnnotifiedAluga.map(a => ({ asset: a, type: 'aluga' as const }))
      ];

      if (targets.length === 0) return;

      // Mark as processed in session right away
      targets.forEach(({ asset }) => {
        processedNotificationsRef.current.add(asset.id);
      });

      console.log(`[Automatic ITCS Notifier] Found ${targets.length} expiring unnotified contracts (Mac: ${expiringUnnotifiedMacs.length}, Aluga: ${expiringUnnotifiedAluga.length})!`);

      for (const { asset, type } of targets) {
        try {
          const response = await fetch('/api/send-itcs-notification', {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ asset }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[Automatic ITCS Notifier] Notified ITCS successfully for ${asset.consultantName} (${type}):`, data.status);

            const updatedAsset: Asset = {
              ...asset,
              itcsNotified: true,
              itcsNotificationDate: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };

            // Save to correct collection
            if (type === 'mac') {
              await saveAsset(updatedAsset);
              setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset : a));
            } else {
              await saveAlugaRental(updatedAsset);
              setAlugaRentals(prev => prev.map(a => a.id === asset.id ? updatedAsset : a));
            }
          } else {
            console.error(`[Automatic ITCS Notifier] Failed backend notification call for ${asset.id} (${type})`);
            processedNotificationsRef.current.delete(asset.id);
          }
        } catch (err) {
          console.error(`[Automatic ITCS Notifier] Error calling automatic notification endpoint for ${asset.id} (${type}):`, err);
          processedNotificationsRef.current.delete(asset.id);
        }
      }
    };

    const timer = setTimeout(() => {
      checkAndNotifyExpiringRentals();
    }, 2000);

    return () => clearTimeout(timer);
  }, [assets, alugaRentals, user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [assetsResult, alugaResult, subsResult, mailboxesResult, securityGroupsResult] = await Promise.all([
        getAssets(),
        getAlugaRentals(),
        getSubscriptions(),
        getMailboxes(),
        getSecurityGroups()
      ]);
      setAssets(assetsResult.data);
      setAlugaRentals(alugaResult.data);
      setSubscriptions(subsResult.data);
      setMailboxes(mailboxesResult.data);
      setSecurityGroups(securityGroupsResult.data);
      setIsOffline(assetsResult.isOffline);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (asset: Asset) => {
    setIsLoading(true);
    try {
      if (currentRentalType === 'aluga') {
        await saveAlugaRental(asset);
      } else {
        await saveAsset(asset);
      }
      await refreshData();
    } catch (error) {
      alert("Erro ao gravar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (asset: Asset, type: 'mac' | 'aluga' = 'mac') => {
    setAssetToDelete(asset);
    setCurrentRentalType(type);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    
    setIsLoading(true);
    try {
      if (currentRentalType === 'aluga') {
        await deleteAlugaRental(assetToDelete.id);
      } else {
        await deleteAsset(assetToDelete.id);
      }
      await refreshData();
    } catch (error) {
      alert("Erro ao eliminar. Tente novamente.");
    } finally {
      setIsLoading(false);
      setAssetToDelete(null);
    }
  };

  const handleResendItcsNotification = async (asset: Asset) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-itcs-notification', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ asset }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Notificação ITCS enviada com sucesso!\n\nStatus: ${data.status}\nDestinatário: ${data.recipient || "itcs_operacao@moongy.pt"}`);

        // Persist the status in Firestore and update the list
        const updatedAsset: Asset = {
          ...asset,
          itcsNotified: true,
          itcsNotificationDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };

        const isMac = assets.some(a => a.id === asset.id);
        if (isMac) {
          await saveAsset(updatedAsset);
        } else {
          await saveAlugaRental(updatedAsset);
        }
        await refreshData();
      } else {
        const errorData = await response.json();
        alert(`Erro ao enviar notificação: ${errorData.error || response.statusText}`);
      }
    } catch (err: any) {
      alert(`Erro de ligação ao enviar notificação: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubscription = async (sub: Subscription) => {
    setIsLoading(true);
    try {
      await saveSubscription(sub);
      await refreshData();
    } catch (error) {
      alert("Erro ao gravar subscrição.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubscription = async (sub: Subscription) => {
    if (confirm(`Tem a certeza que deseja eliminar a subscrição de ${sub.name}?`)) {
      setIsLoading(true);
      try {
        await deleteSubscription(sub.id);
        await refreshData();
      } catch (error) {
        alert("Erro ao eliminar subscrição.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openNewSubscription = () => {
    setSelectedSubscription(null);
    setIsSubModalOpen(true);
  };

  const openEditSubscription = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setIsSubModalOpen(true);
  };

  const handleSaveMailbox = async (mailbox: Mailbox) => {
    setIsLoading(true);
    try {
      await saveMailbox(mailbox);
      await refreshData();
    } catch (error) {
      alert("Erro ao gravar registo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMailbox = async (mailbox: Mailbox) => {
    if (confirm(`Tem a certeza que deseja eliminar o registo de ${mailbox.displayName}?`)) {
      setIsLoading(true);
      try {
        await deleteMailbox(mailbox.id);
        await refreshData();
      } catch (error) {
        alert("Erro ao eliminar registo.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openNewMailbox = () => {
    setSelectedMailbox(null);
    setIsMailboxModalOpen(true);
  };

  const openEditMailbox = (mailbox: Mailbox) => {
    setSelectedMailbox(mailbox);
    setIsMailboxModalOpen(true);
  };

  const handleSaveSecurityGroup = async (group: SecurityGroupRecord) => {
    setIsLoading(true);
    try {
      await saveSecurityGroup(group);
      await refreshData();
    } catch (error) {
      alert("Erro ao gravar grupo de segurança.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSecurityGroup = async (group: SecurityGroupRecord) => {
    if (confirm(`Tem a certeza que deseja eliminar o grupo de segurança ${group.name}?`)) {
      setIsLoading(true);
      try {
        await deleteSecurityGroup(group.id);
        await refreshData();
      } catch (error) {
        alert("Erro ao eliminar grupo de segurança.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openNewPermission = () => {
    setSelectedSecurityGroup(null);
    setIsPermissionModalOpen(true);
  };

  const openEditSecurityGroup = (group: SecurityGroupRecord) => {
    setSelectedSecurityGroup(group);
    setIsPermissionModalOpen(true);
  };

  const openNewRental = () => {
    setSelectedAsset(null);
    setCurrentRentalType('mac');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openNewAlugaRental = () => {
    setSelectedAsset(null);
    setCurrentRentalType('aluga');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openView = (asset: Asset, type: 'mac' | 'aluga' = 'mac') => {
    setSelectedAsset(asset);
    setCurrentRentalType(type);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const openEdit = (asset: Asset, type: 'mac' | 'aluga' = 'mac') => {
    setSelectedAsset(asset);
    setCurrentRentalType(type);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openRenew = (asset: Asset, type: 'mac' | 'aluga' = 'mac') => {
    setSelectedAsset(asset);
    setCurrentRentalType(type);
    setModalMode('renew');
    setIsModalOpen(true);
  };

  const openEmailGenerator = (asset: Asset) => {
    setEmailAsset(asset);
    setIsEmailModalOpen(true);
  };

  // If not authenticated, show login
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Layout 
      mainTab={mainTab}
      onMainTabChange={setMainTab}
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      activeSubTab={activeSubTab}
      onSubTabChange={setActiveSubTab}
      onNewRental={openNewRental}
      onNewAlugaRental={openNewAlugaRental}
      onNewSubscription={openNewSubscription}
      onNewMailbox={openNewMailbox}
      onNewPermission={openNewPermission}
      user={user}
      onLogout={handleLogout}
      isOffline={isOffline}
    >
      {mainTab === 'home' && (
        <HomeDashboard 
          assets={assets} 
          alugaRentals={alugaRentals}
          subscriptions={subscriptions} 
          mailboxes={mailboxes}
          onNavigateToRentals={() => {
            setMainTab('mac-rentals');
            setActiveTab('rentals');
            setMacFilterText('');
            setMacSelectedCompany('ALL');
          }}
          onNavigateToAlugaRentals={() => {
            setMainTab('aluga-rentals');
            setActiveTab('rentals');
            setAlugaFilterText('');
            setAlugaSelectedCompany('ALL');
          }}
          onNavigateToSubscriptions={() => {
            setMainTab('subscriptions');
            setActiveSubTab('list');
          }}
          onNavigateToMailboxes={() => {
            setMainTab('mailboxes');
          }}
          onNavigateToAsset={(asset, type) => {
            if (type === 'aluga') {
              setMainTab('aluga-rentals');
              setActiveTab('rentals');
              setAlugaFilterText(asset.serialNumber);
              setAlugaSelectedCompany('ALL');
            } else {
              setMainTab('mac-rentals');
              setActiveTab('rentals');
              setMacFilterText(asset.serialNumber);
              setMacSelectedCompany('ALL');
            }
          }}
        />
      )}

      {mainTab === 'mac-rentals' && (
        <>
          {isLoading && assets.length === 0 ? (
            <div className="flex justify-center items-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <Dashboard assets={assets} />
          ) : (
            <AssetList 
              assets={assets} 
              type="mac"
              filterText={macFilterText}
              onFilterTextChange={setMacFilterText}
              selectedCompany={macSelectedCompany}
              onSelectedCompanyChange={setMacSelectedCompany}
              onView={(a) => openView(a, 'mac')}
              onEdit={(a) => openEdit(a, 'mac')}
              onRenew={(a) => openRenew(a, 'mac')}
              onGenerateEmail={openEmailGenerator}
              onDelete={(a) => confirmDelete(a, 'mac')}
              onResendItcsNotification={handleResendItcsNotification}
            />
          )}

          <AssetFormModal
            isOpen={isModalOpen && currentRentalType === 'mac'}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            initialData={selectedAsset}
            mode={modalMode}
            currentUser={user}
            rentalType="mac"
          />
          {/* ... */}
        </>
      )}

      {mainTab === 'aluga-rentals' && (
        <>
          {isLoading && alugaRentals.length === 0 ? (
            <div className="flex justify-center items-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <Dashboard assets={alugaRentals} />
          ) : (
            <AssetList 
              assets={alugaRentals} 
              type="aluga"
              filterText={alugaFilterText}
              onFilterTextChange={setAlugaFilterText}
              selectedCompany={alugaSelectedCompany}
              onSelectedCompanyChange={setAlugaSelectedCompany}
              onView={(a) => openView(a, 'aluga')}
              onEdit={(a) => openEdit(a, 'aluga')}
              onRenew={(a) => openRenew(a, 'aluga')}
              onGenerateEmail={openEmailGenerator}
              onDelete={(a) => confirmDelete(a, 'aluga')}
              onResendItcsNotification={handleResendItcsNotification}
            />
          )}

          <AssetFormModal
            isOpen={isModalOpen && currentRentalType === 'aluga'}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            initialData={selectedAsset}
            mode={modalMode}
            currentUser={user}
            rentalType="aluga"
          />
        </>
      )}

      {mainTab === 'subscriptions' && (
        <div className="space-y-6">
          {isLoading && subscriptions.length === 0 ? (
            <div className="flex justify-center items-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeSubTab === 'dashboard' ? (
            <SubscriptionDashboard subscriptions={subscriptions} />
          ) : (
            <SubscriptionList 
              subscriptions={subscriptions}
              onEdit={openEditSubscription}
              onDelete={handleDeleteSubscription}
            />
          )}

          <SubscriptionFormModal
            isOpen={isSubModalOpen}
            onClose={() => setIsSubModalOpen(false)}
            onSave={handleSaveSubscription}
            initialData={selectedSubscription}
          />
        </div>
      )}

      {mainTab === 'mailboxes' && (
        <div className="space-y-6">
          {isLoading && mailboxes.length === 0 ? (
            <div className="flex justify-center items-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <MailboxList 
              mailboxes={mailboxes}
              onEdit={openEditMailbox}
              onDelete={handleDeleteMailbox}
            />
          )}

          <MailboxFormModal
            isOpen={isMailboxModalOpen}
            onClose={() => setIsMailboxModalOpen(false)}
            onSave={handleSaveMailbox}
            initialData={selectedMailbox}
          />
        </div>
      )}

      {mainTab === 'permissions' && (
        <div className="space-y-6">
          {isLoading && securityGroups.length === 0 ? (
            <div className="flex justify-center items-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <PermissionList 
              securityGroups={securityGroups}
              onEdit={openEditSecurityGroup}
              onDelete={handleDeleteSecurityGroup}
            />
          )}

          <PermissionFormModal
            isOpen={isPermissionModalOpen}
            onClose={() => setIsPermissionModalOpen(false)}
            onSave={handleSaveSecurityGroup}
            initialData={selectedSecurityGroup}
          />
        </div>
      )}

      <EmailGeneratorModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        asset={emailAsset}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAssetToDelete(null);
        }}
        onConfirm={handleDelete}
        asset={assetToDelete}
      />
    </Layout>
  );
};

export default App;