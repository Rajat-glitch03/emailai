import type { AppConfig, Conversation, Integration } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload as T;
}

export const api = {
  health: () => request<{ ok: boolean; database: string; ai: string }>('/api/health'),
  config: () => request<AppConfig>('/api/config'),
  conversations: (includeArchived = false) => request<Conversation[]>(`/api/conversations${includeArchived ? '?includeArchived=true' : ''}`),
  updateConversation: (id: string, patch: Partial<Conversation>) => request<Conversation>(`/api/conversations/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  reclassify: (id: string) => request<Conversation>(`/api/conversations/${encodeURIComponent(id)}/reclassify`, { method: 'POST' }),
  integrations: () => request<Integration[]>('/api/integrations'),
  gmailStatus: () => request<{ configured: boolean; connected: boolean; integration: Integration | null }>('/api/integrations/gmail/status'),
  syncGmail: () => request<{ synced: number; accountEmail: string }>('/api/integrations/gmail/sync', { method: 'POST' }),
  disconnectGmail: () => request<{ ok: boolean }>('/api/integrations/gmail', { method: 'DELETE' }),
  connectOutlookDemo: () => request<{ connected: boolean; mode: string; message: string }>('/api/integrations/outlook/demo-connect', { method: 'POST' }),
  summarize: (id: string) => request<{ summary: string; keyPoints: string[]; nextStep: string; source: string }>('/api/ai/summarize', { method: 'POST', body: JSON.stringify({ id }) }),
  draft: (id: string, tone = 'warm and professional') => request<{ subject: string; body: string; notes: string; source: string }>('/api/ai/draft', { method: 'POST', body: JSON.stringify({ id, tone }) }),
  ask: (question: string) => request<{ answer: string; conversationIds: string[]; source: string }>('/api/ai/ask', { method: 'POST', body: JSON.stringify({ question }) }),
};
