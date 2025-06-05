export interface RelatedPatternInfo {
  number: number;
  text: string;
}

export interface Pattern {
  id: number;
  numberText: string;
  name: string;
  category: string;
  group: string;
  imageUrl: string;
  introduction: string;
  exampleQuote?: {
    person: string;
    quote: string;
  };
  context: string;
  problem: string;
  forces: string;
  solution: string;
  actions: string;
  consequences: string;
  mainText: string;
  relatedPatterns?: RelatedPatternInfo[];
}

export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: Date;
  relevantPatterns?: Pattern[];
  isLoading?: boolean;
}

export interface ProcessEnv {
  API_KEY: string;
}

declare global {
  interface Window {
    process: {
      env: ProcessEnv;
    };
  }
}

export interface SystemInstructionOption {
  id: string;
  label: string;
  instruction: string;
}
