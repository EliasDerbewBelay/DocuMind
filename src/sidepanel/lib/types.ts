export type DocumentType = 'pdf' | 'html' | 'google-doc' | 'word' | 'unknown';

export interface ExtractedDocument {
  type: DocumentType;
  title: string;
  url: string;
  rawText: string;
  pageCount?: number;
  wordCount: number;
  language: string;
  extractedAt: number;
}

export interface DocumentSummary {
  tldr: string;
  topics: string[];
  documentType: string;
  readingTimeMinutes: number;
  keyHighlights: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citation?: {
    pageNumber?: number;
    excerpt: string;
  };
  timestamp: number;
  isStreaming?: boolean;
}

export interface Bookmark {
  id: string;
  documentUrl: string;
  note: string;
  excerpt: string;
  createdAt: number;
}

export interface AppSettings {
  apiKey: string;
  language: 'en' | 'am';
  autoSummarize: boolean;
  highlightEnabled: boolean;
}

export type AppView = 'loading' | 'empty' | 'summary' | 'chat' | 'bookmarks' | 'settings';
