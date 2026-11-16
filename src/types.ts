export type Responsibility = 'assistant_to_reply' | 'client_to_reply' | 'no_reply_needed' | 'needs_review';
export type Priority = 'low' | 'medium' | 'high';

export interface EmailMessage {
  from: string;
  email: string;
  date: string;
  body: string;
}

export interface Conversation {
  id: string;
  sender: string;
  senderEmail: string;
  avatar: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  important: boolean;
  archived: boolean;
  completed: boolean;
  manualOverride?: boolean;
  classificationSource?: string;
  category: string;
  responsibility: Responsibility;
  confidence: number;
  priority: Priority;
  summary: string;
  reason: string;
  suggestedAction: string;
  messages: EmailMessage[];
  meeting: { date: string; label: string } | null;
  source?: 'demo' | 'gmail';
}

export interface AppConfig {
  appName: string;
  aiMode: string;
  gmail: { configured: boolean; scopes: string[]; mode: string };
  outlook: { configured: boolean; mode: string; note: string };
}

export interface Integration {
  provider: string;
  accountEmail: string;
  connectedAt: string;
  lastSyncedAt: string | null;
  status: string;
}
