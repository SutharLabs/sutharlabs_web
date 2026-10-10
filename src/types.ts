export interface UserProfile {
  email: string;
  name: string;
  isLoggedIn: boolean;
  role?: 'Admin' | 'Developer' | 'Banned' | 'Pending';
  token?: string;
  mustChangePassword?: boolean;
  bio?: string;
  githubHandle?: string;
  company?: string;
  joinedAt?: string;
}

export type WorkspaceTab = 
  | 'Stock Tracker' 
  | 'Custom Flow' 
  | 'Accounting' 
  | 'Admin Console' 
  | 'Manage Plugins' 
  | 'Manage Apps' 
  | 'Manage Portfolios' 
  | 'Contact Inquiries'
  | 'Reported Bugs'
  | 'Doc Nexus' 
  | 'README' 
  | 'Plugin Store' 
  | 'Profile & Settings';

export interface ContactInquiryItem {
  id: string;
  trackingId: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  status: 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Archived' | string;
  notes?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Developer' | 'Banned' | 'Pending';
  joinedAt: string;
  activityCount: number;
}


export interface Invoice {
  id: string;
  date: string;
  client: string;
  amount: number;
  status: 'Paid' | 'Pending';
}

export interface FlowNode {
  id: string;
  label: string;
  type: 'source' | 'processor' | 'output';
  fileUsed?: string;
  pluginActive?: boolean;
  status?: string;
  x: number;
  y: number;
}

export interface FlowConnection {
  fromId: string;
  toId: string;
}

export interface TerminalLog {
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'AGENT' | 'DATA' | 'ALERT' | 'ERROR';
  message: string;
}

export interface StockTick {
  time: string;
  price: number;
}

export interface UserPortfolio {
  cash: number;
  shares: number;
  buyPrice: number;
}

export interface StorePlugin {
  id: string;
  name: string;
  category: string;
  type: 'Free' | 'Premium' | 'Trial';
  downloads: string;
  rating: number;
  description: string;
  iconSymbol: string;
  tags: string[];
}

