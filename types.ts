export enum OrbitLevel {
  SURVIVAL = 'SURVIVAL',
  GROWTH = 'GROWTH',
  VISION = 'VISION',
  FLOATING = 'FLOATING'
}

export interface Thought {
  id: string;
  content: string;
  level: OrbitLevel;
  timestamp: number;
  reasoning?: string; 
  completed: boolean;
  connections?: string[]; // 存储关联的思想 ID
  vector?: number[];      // 真正的 RAG 核心：高维向量数据
  similarity?: number;    // 检索时的实时得分
  clarificationStatus?: 'pending' | 'clarified';
}

export interface CareerMatch {
  title: string;
  matchScore: number;
  source: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}