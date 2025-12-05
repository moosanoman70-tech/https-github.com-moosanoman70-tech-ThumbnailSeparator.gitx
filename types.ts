export enum ElementType {
  PERSON = 'PERSON',
  OBJECT = 'OBJECT',
  TEXT = 'TEXT',
  LOGO = 'LOGO',
  BACKGROUND = 'BACKGROUND',
  EFFECT = 'EFFECT'
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface LayerData {
  id: string;
  label: string;
  type: ElementType;
  subtype?: string;
  confidence: number;
  box: BoundingBox;
  zIndex: number;
  dominantColor: string;
  visible: boolean;
  maskUrl?: string; // Generated on client side
}

export interface CompositionAnalysis {
  ruleOfThirdsScore: number;
  visualBalanceScore: number;
  dominantColors: string[];
  brightnessMap: string; // Description
  contrastLevel: string;
  suggestions: string[];
  eyeContact: boolean;
  visualWeightCenter: { x: number; y: number };
}

export interface ProcessingResult {
  layers: LayerData[];
  analysis: CompositionAnalysis;
}

export interface AppState {
  status: 'IDLE' | 'ANALYZING' | 'SUCCESS' | 'ERROR';
  imageSrc: string | null;
  result: ProcessingResult | null;
  error: string | null;
}
