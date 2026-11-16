import crypto from 'node:crypto';
import { google } from 'googleapis';
import { classifyConversation } from './ai.js';
import { getIntegration, getConversation, saveIntegration, removeIntegration, updateIntegrationSync, upsertConversation } from './store.js';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
];
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function oauthReady() {
  return Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REDIRECT_URI);
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
  );
}

function signState(payload) {
  const secret = process.env.SESSION_SECRET || process.env.GMAIL_CLIENT_SECRET;
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyState(state) {
  if (!state || !state.includes('.')) return false;
  const [encoded, signature] = state.split('.');
  const secret = process.env.SESSION_SECRET || process.env.GMAIL_CLIENT_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return false; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return Date.now() - payload.issuedAt < STATE_MAX_AGE_MS && Date.now() >= payload.issuedAt;
  } catch { return false; }
}

export function getGmailConnectionStatus() {
  return { configured: oauthReady(), scopes: SCOPES, mode: 'read_only' };
}

export function createGmailAuthUrl() {
  if (!oauthReady()) throw new Error('Gmail OAuth is not configured. Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REDIRECT_URI to your environment.');
  const client = oauthClient();
  const state = signState({ nonce: crypto.randomBytes(16).toString('hex'), issuedAt: Date.now() });
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: SCOPES,
    state,
  });
}

function decodeBody(data = '') {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function collectText(payload) {
  if (!payload) return '';
  const mime = (payload.mimeType || '').toLowerCase();
  if (payload.body?.data && (mime === 'text/plain' || !payload.parts?.length)) return decodeBody(payload.body.data);
  const parts = payload.parts || [];
  const plain = parts.find((part) => (part.mimeType || '').toLowerCase() === 'text/plain');
  if (plain?.body?.data) return decodeBody(plain.body.data);
  const nested = parts.map(collectText).filter(Boolean).join('\n');
  if (nested) return nested;
  if (payload.body?.data) return decodeBody(payload.body.data);
  return '';
}

function cleanText(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

function headerValue(headers, name) {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

function parseSender(value) {
  const match = value.match(/^(.*?)\s*<([^>]+)>/);
  if (match) return { name: match[1].replace(/^"|"$/g, '').trim() || match[2], email: match[2].trim() };
  return { name: value.trim() || 'Unknown sender', email: value.trim() };
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'EM';
}

export async function completeGmailCallback(code, state) {
  if (!oauthReady()) throw new Error('Gmail OAuth is not configured.');
  if (!verifyState(state)) throw new Error('The Gmail authorization state is invalid or expired. Please try connecting again.');
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email;
  if (!email) throw new Error('Google did not return an email address.');
  await saveIntegration('gmail', email, tokens);
  return email;
}

export async function syncGmailInbox() {
  const integration = await getIntegration('gmail');
  if (!integration) throw new Error('Connect a Gmail account before syncing.');
  const client = oauthClient();
  client.setCredentials(integration.tokens);
  const gmail = google.gmail({ version: 'v1', auth: client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  const ownEmail = (profile.data.emailAddress || integration.accountEmail || '').toLowerCase();
  const listed = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:inbox newer_than:90d',
    maxResults: 25,
  });
  const threadIds = [...new Set((listed.data.messages || []).map((message) => message.threadId).filter(Boolean))].slice(0, 20);
  let synced = 0;
  for (const threadId of threadIds) {
    const result = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' });
    const rawMessages = result.data.messages || [];
    const messages = rawMessages.map((message) => {
      const headers = message.payload?.headers || [];
      const sender = parseSender(headerValue(headers, 'From'));
      return {
        from: sender.name,
        email: sender.email,
        date: new Date(Number(message.internalDate || Date.now())).toISOString(),
        body: cleanText(collectText(message.payload)),
      };
    });
    const latestRaw = rawMessages.at(-1);
    if (!latestRaw) continue;
    const latestHeaders = latestRaw.payload?.headers || [];
    const latestSender = parseSender(headerValue(latestHeaders, 'From'));
    const lastExternal = [...messages].reverse().find((message) => message.email.toLowerCase() !== ownEmail) || messages.at(-1);
    const subject = headerValue(latestHeaders, 'Subject') || '(no subject)';
    const preview = cleanText(latestRaw.snippet || messages.at(-1)?.body || '').slice(0, 220);
    const labels = latestRaw.labelIds || [];
    const timestamp = new Date(Number(latestRaw.internalDate || Date.now())).toISOString();
    const conversation = {
      id: `gmail-${threadId}`,
      sender: lastExternal?.from || latestSender.name,
      senderEmail: lastExternal?.email || latestSender.email,
      avatar: initials(lastExternal?.from || latestSender.name),
      subject,
      preview,
      timestamp,
      unread: labels.includes('UNREAD'),
      important: labels.includes('IMPORTANT') || labels.includes('STARRED'),
      archived: false,
      completed: false,
      category: 'General',
      responsibility: 'needs_review',
      confidence: 0.5,
      priority: 'medium',
      summary: preview,
      reason: 'New Gmail conversation. Review the classification before relying on it.',
      suggestedAction: 'Review the conversation and assign a response owner.',
      messages,
      meeting: null,
      source: 'gmail',
    };
    const existing = await getConversation(conversation.id);
    const hasNewMessage = !existing || new Date(timestamp).getTime() > new Date(existing.timestamp).getTime();
    if (existing?.manualOverride && !hasNewMessage) {
      Object.assign(conversation, {
        responsibility: existing.responsibility, confidence: existing.confidence, priority: existing.priority,
        category: existing.category, summary: existing.summary, reason: existing.reason,
        suggestedAction: existing.suggestedAction, manualOverride: true,
      });
    } else {
      const classification = await classifyConversation(conversation);
      Object.assign(conversation, classification, { manualOverride: false });
    }
    if (messages.at(-1)?.email?.toLowerCase() === ownEmail && !conversation.manualOverride) {
      conversation.responsibility = 'no_reply_needed';
      conversation.reason = 'The latest message was sent from the connected account, so no new response is currently outstanding.';
      conversation.suggestedAction = 'No response needed unless a new message arrives.';
    }
    await upsertConversation(conversation);
    synced += 1;
  }
  await updateIntegrationSync('gmail');
  return { synced, accountEmail: ownEmail };
}

export async function disconnectGmail() {
  const integration = await getIntegration('gmail');
  if (integration?.tokens?.refresh_token || integration?.tokens?.access_token) {
    try {
      await oauthClient().revokeToken(integration.tokens.refresh_token || integration.tokens.access_token);
    } catch (error) {
      console.warn('Google token revocation returned an error:', error.message);
    }
  }
  await removeIntegration('gmail');
}
