import { TerminalLog } from "../../types.js";

export type DocumentFormat = 'canvas' | 'markdown' | 'richtext' | 'sheet' | 'slides';

export type CanvasShapeType = 'rect' | 'circle' | 'diamond' | 'text' | 'sticky' | 'arrow' | 'badge' | 'card' | 'image';

export interface CanvasElement {
  id: string;
  type: CanvasShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  opacity?: number;
  shadow?: boolean;
  borderRadius?: number;
  arrowTo?: string; // Target element id if connector
  imageUrl?: string;
  imageFit?: 'contain' | 'cover' | 'fill';
  aspectRatio?: number;
}

export interface CanvasSceneState {
  elements: CanvasElement[];
  width: number;
  height: number;
  backgroundColor: string;
  gridSnap: boolean;
  aspectRatio: 'A4' | '16:9' | 'Square' | 'Infinite';
}

export interface RichDocPage {
  id: string;
  title: string;
  body: string;
  watermark?: string;
}

export interface RichDocState {
  paperSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: 'normal' | 'compact' | 'wide';
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  pages: RichDocPage[];
}

export interface SheetColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'status' | 'date';
  width?: number;
}

export interface SheetRow {
  id: string;
  cells: Record<string, string | number>;
}

export interface SpreadsheetState {
  columns: SheetColumn[];
  rows: SheetRow[];
  currencySymbol: string;
  showSummaryRow: boolean;
}

export interface SlideItem {
  id: string;
  title: string;
  subtitle?: string;
  layout: 'title' | 'bullets' | 'split' | 'metric' | 'quote';
  bulletPoints?: string[];
  leftContent?: string;
  rightContent?: string;
  metricValue?: string;
  metricLabel?: string;
  speakerNotes?: string;
  bgGradient?: string;
}

export interface SlideDeckState {
  aspectRatio: '16:9' | '4:3';
  theme: 'dark' | 'light' | 'cyan' | 'purple' | 'amber';
  slides: SlideItem[];
}

export interface DocNexusMetadata {
  format?: DocumentFormat;
  tags?: string[];
  category?: string;
  isPinned?: boolean;
  authorEmail?: string;
  wordCount?: number;
  elementCount?: number;
  theme?: string;
  pdfDataUrl?: string;
  imageSrc?: string;
  [key: string]: any;
}

export interface DocNexusDocument {
  id: string;
  title: string;
  format: DocumentFormat;
  content: string; // Serialized JSON state for canvas/sheet/slides/doc or raw text for markdown
  metadata: DocNexusMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface DocTemplate {
  id: string;
  name: string;
  format: DocumentFormat;
  category: string;
  description: string;
  iconSymbol: string;
  defaultTitle: string;
  initialContent: string;
  metadata: DocNexusMetadata;
}

export interface DocNexusStudioProps {
  logs?: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userEmail?: string;
  userToken: string;
  theme?: 'dark' | 'light';
}
