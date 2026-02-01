export interface Env {
  DB: D1Database;
  AI: Ai;
}

export interface FeedbackItem {
  id: number;
  source: 'discord' | 'github' | 'twitter' | 'support';
  content: string;
  author: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  urgency: 'low' | 'medium' | 'high' | null;
  themes: string; // JSON array stored as text
  created_at: string;
  analyzed_at: string | null;
}
