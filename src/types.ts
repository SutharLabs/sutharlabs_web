export interface UserProfile {
  email: string;
  name: string;
  isLoggedIn: boolean;
  role?: 'Admin' | 'Developer' | 'Banned';
  token?: string;
}

export type WorkspaceTab = 'Stock_Tracker.jsx' | 'Custom_Flow.flow' | 'Accounting.module' | 'Admin_Console.module' | 'Doc_Nexus.jsx' | 'README.md' | 'Workspace_Plugins.store';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Developer' | 'Banned';
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

