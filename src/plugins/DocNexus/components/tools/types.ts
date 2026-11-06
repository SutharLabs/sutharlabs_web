export type ToolCategory = 'all' | 'doc' | 'dev';

export type ToolType = 
  | 'pdf-to-image' 
  | 'image-to-pdf' 
  | 'merge-pdf' 
  | 'split-pdf' 
  | 'pdf-editor' 
  | 'pdf-to-word' 
  | 'compress-image' 
  | 'ocr-pdf'
  | 'receipt-to-csv'
  | 'multilingual-ocr'
  | 'business-card-scanner'
  | 'qr-generator'
  | 'json-converter'
  | 'hash-generator'
  | 'uuid-password'
  | 'text-diff'
  | 'base64-tool';

export interface ToolMeta {
  id: ToolType;
  title: string;
  tagline: string;
  badge: string;
  category: 'doc' | 'dev';
  icon: any;
  accentColor: string;
}

export interface SubToolProps {
  isLight: boolean;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  setStatus: (msg: string | null) => void;
  setError: (err: string | null) => void;
  addLog: (type: 'INFO' | 'SUCCESS' | 'ERROR', message: string) => void;
}

