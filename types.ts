export enum Company {
  AGAP2IT = 'AGAP2IT',
  KCSIT = 'KCSIT',
  ADENTIS = 'ADENTIS',
  CODEWIN = 'CODEWIN',
  RECODME = 'RECODME',
  TEAM_IT = 'TEAM-IT',
  BEE_ENGINEERING = 'BEE ENGINEERING',
  MOONGY = 'MOONGY',
  OTHER = 'OUTRA'
}

export enum Location {
  PORTO = 'Porto',
  LISBOA = 'Lisboa'
}

export enum AssetStatus {
  PRODUCTION = 'Em Produção',
  STOCK = 'Em Stock',
  RETURNED = 'Devolvido'
}

export interface RenewalHistoryEntry {
  startDate: string;
  endDate?: string;
  proposalNumber: string;
  poNumber: string;
  monthlyValueExvat: number;
  monthlyValueIncVat: number;
  renewedBy: string;
  renewedAt: string;
}

export interface Asset {
  id: string;
  consultantName: string;
  managerName: string;
  teamMember: string; // Member who requested/renewed the asset
  equipmentSpecs: string;
  proposalNumber: string;
  serialNumber: string;
  qrCode?: string;
  poNumber: string; // Purchase Order
  durationMonths?: number;
  startDate: string; // ISO Date
  endDate?: string; // ISO Date
  monthlyValueExvat: number;
  monthlyValueIncVat: number;
  status: AssetStatus;
  project: string;
  observations: string;
  company: Company;
  location: Location;
  lastUpdated: string;
  jiraTicketUrl?: string;
  renewalChecklist?: boolean[];
  history?: RenewalHistoryEntry[];
  itcsNotified?: boolean;
  itcsNotificationDate?: string;
}

export interface DashboardStats {
  totalAssets: number;
  activeAssets: number;
  expiringAssets: number;
  totalMonthlyCostExVat: number;
  byStatus: { name: string; value: number }[];
  byCompany: { name: string; value: number }[];
}

export enum SubscriptionType {
  M365_APPS = 'Microsoft 365 Apps for Enterprise',
  COPILOT = 'Microsoft Copilot 365',
  VISUAL_STUDIO = 'Microsoft Visual Studio',
  CLAUDE_AI = 'Claude AI'
}

export enum SubscriptionPortal {
  MOONGY = 'Moongy',
  KCSIT = 'KCSIT',
  COMPRADAS = 'Compradas'
}

export enum MailboxType {
  SHARED_MAILBOX = 'Shared Mailbox',
  DISTRIBUTION_LIST = 'Lista de Distribuição'
}

export enum DistributionListType {
  DYNAMIC = 'Dinâmica',
  ASSIGNED = 'Assign'
}

export interface MailboxMember {
  name: string;
  email: string;
}

export interface Mailbox {
  id: string;
  type: MailboxType;
  displayName: string;
  email: string;
  requestedBy: string;
  creationDate: string;
  jiraTicketUrl?: string;
  
  // For Shared Mailbox
  delegatedTo?: MailboxMember[];
  
  // For Distribution List
  distributionType?: DistributionListType;
  members?: MailboxMember[];
}

export interface Subscription {
  id: string;
  name: string;
  email: string;
  managerName: string;
  project: string;
  jiraTicketUrl?: string;
  type: SubscriptionType;
  portal?: SubscriptionPortal; // Only applicable for Visual Studio
  assignmentDate: string;
}

export enum PermissionCompany {
  ADENTIS = 'ADENTIS',
  AGAP2IND = 'AGAP2IND',
  AGAP2IT = 'AGAP2IT',
  ATS4IT_BE = 'ATS4IT BE',
  ATS4IT_DK = 'ATS4IT DK',
  BEE_ENGINEERING = 'BEE ENGINEERING',
  CODEWIN = 'CODEWIN',
  KCSIT = 'KCSIT',
  MOONGY = 'MOONGY',
  RECODME_ES = 'RECODME ES',
  SOWIN_ES = 'SOWIN ES',
  TEAM_IT = 'TEAM-IT'
}

export enum PermissionType {
  READ = 'Somente Leitura',
  WRITE = 'Escrita'
}

export interface PermissionMember {
  id: string;
  userName: string;
  userEmail: string;
  permissionType: PermissionType;
  jiraTicketUrl?: string;
  assignmentDate: string;
}

export interface SecurityGroupRecord {
  id: string;
  name: string;
  company: PermissionCompany;
  members: PermissionMember[];
}

// Simple User interface for Auth simulation
export interface UserProfile {
  name: string;
  email: string;
}