import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { connectDatabase, databaseIsReady, listConversations, getConversation, updateConversation, upsertConversation, listIntegrations } from './store.js';
import { aiMode, classifyConversation, summarizeConversation, draftReply, answerInboxQuestion } from './ai.js';
import { getGmailConnectionStatus, createGmailAuthUrl, completeGmailCallback, syncGmailInbox, disconnectGmail } from './gmail.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use('/api/ai', rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));

const patchSchema = z.object({
  unread: z.boolean().optional(),
  important: z.boolean().optional(),
  archived: z.boolean().optional(),
  completed: z.boolean().optional(),
  responsibility: z.enum(['assistant_to_reply', 'client_to_reply', 'no_reply_needed', 'needs_review']).optional(),
  category: z.string().max(40).optional(),
}).strict();

app.get('/api/health', async (_req, res) => {
  await connectDatabase();
  res.json({ ok: true, database: databaseIsReady() ? 'mongodb' : 'memory_demo', ai: aiMode(), timestamp: new Date().toISOString() });
});

app.get('/api/config', (_req, res) => {
  res.json({
    appName: 'Tandem',
    aiMode: aiMode(),
    gmail: getGmailConnectionStatus(),
    outlook: { configured: false, mode: 'simulated', note: 'Microsoft connection is represented as a prototype flow. Configure Microsoft Graph OAuth before using real Outlook mail.' },
  });
});

app.get('/api/conversations', async (req, res, next) => {
  try {
    await connectDatabase();
    const conversations = await listConversations({ includeArchived: req.query.includeArchived === 'true' });
    res.json(conversations);
  } catch (error) { next(error); }
});

app.get('/api/conversations/:id', async (req, res, next) => {
  try {
    await connectDatabase();
    const conversation = await getConversation(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    res.json(conversation);
  } catch (error) { next(error); }
});

app.post('/api/conversations/:id/reclassify', async (req, res, next) => {
  try {
    await connectDatabase();
    const conversation = await getConversation(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    const classification = await classifyConversation(conversation);
    const updated = await upsertConversation({ ...conversation, ...classification, manualOverride: false });
    res.json(updated);
  } catch (error) { next(error); }
});

app.patch('/api/conversations/:id', async (req, res, next) => {
  try {
    await connectDatabase();
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid conversation update.', details: parsed.error.flatten() });
    const updated = await updateConversation(req.params.id, parsed.data);
    if (!updated) return res.status(404).json({ error: 'Conversation not found.' });
    res.json(updated);
  } catch (error) { next(error); }
});

app.post('/api/ai/classify', async (req, res, next) => {
  try {
    const conversation = z.object({ subject: z.string().max(300), preview: z.string().max(2000).optional(), messages: z.array(z.object({ from: z.string(), body: z.string() })).max(30).optional() }).parse(req.body);
    const result = await classifyConversation(conversation);
    res.json(result);
  } catch (error) { next(error); }
});

app.post('/api/ai/summarize', async (req, res, next) => {
  try {
    await connectDatabase();
    const conversation = await getConversation(req.body.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    res.json(await summarizeConversation(conversation));
  } catch (error) { next(error); }
});

app.post('/api/ai/draft', async (req, res, next) => {
  try {
    await connectDatabase();
    const conversation = await getConversation(req.body.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    const tone = typeof req.body.tone === 'string' ? req.body.tone.slice(0, 50) : 'warm and professional';
    res.json(await draftReply(conversation, tone));
  } catch (error) { next(error); }
});

app.post('/api/ai/ask', async (req, res, next) => {
  try {
    await connectDatabase();
    const question = z.string().min(3).max(500).parse(req.body.question);
    const conversations = await listConversations();
    res.json(await answerInboxQuestion(question, conversations));
  } catch (error) { next(error); }
});

app.get('/api/integrations', async (_req, res, next) => {
  try { await connectDatabase();
    res.json(await listIntegrations());
  } catch (error) { next(error); }
});

app.get('/api/integrations/gmail/status', async (_req, res, next) => {
  try { await connectDatabase();
    const integrations = await listIntegrations();
    res.json({ ...getGmailConnectionStatus(), connected: integrations.some((item) => item.provider === 'gmail'), integration: integrations.find((item) => item.provider === 'gmail') || null });
  } catch (error) { next(error); }
});

app.get('/api/integrations/gmail/connect', (_req, res, next) => {
  try { res.redirect(createGmailAuthUrl()); } catch (error) { next(error); }
});

app.get('/api/integrations/gmail/callback', async (req, res) => {
  const base = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  try {
    if (req.query.error) throw new Error(`Google authorization was not completed: ${String(req.query.error)}`);
    await connectDatabase();
    const email = await completeGmailCallback(String(req.query.code || ''), String(req.query.state || ''));
    res.redirect(`${base}/?gmail=connected&account=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('Gmail callback failed:', error.message);
    res.redirect(`${base}/?gmail=error&message=${encodeURIComponent(error.message)}`);
  }
});

app.post('/api/integrations/gmail/sync', async (_req, res, next) => {
  try { await connectDatabase(); res.json(await syncGmailInbox()); } catch (error) { next(error); }
});

app.delete('/api/integrations/gmail', async (_req, res, next) => {
  try { await disconnectGmail(); res.json({ ok: true }); } catch (error) { next(error); }
});

app.post('/api/integrations/outlook/demo-connect', async (_req, res) => {
  res.json({ connected: true, mode: 'simulated', message: 'Outlook is in demo mode. Microsoft Graph OAuth is not configured in this prototype.' });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

app.use((error, _req, res, _next) => {
  const status = error.status || (error.name === 'ZodError' ? 400 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Check the server logs and environment settings.' : error.message });
});

export default app;
