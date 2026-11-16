import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, '../shared/demo-conversations.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const ConversationSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  sender: String,
  senderEmail: String,
  avatar: String,
  subject: String,
  preview: String,
  timestamp: String,
  unread: Boolean,
  important: Boolean,
  archived: Boolean,
  completed: Boolean,
  manualOverride: { type: Boolean, default: false },
  classificationSource: String,
  category: String,
  responsibility: String,
  confidence: Number,
  priority: String,
  summary: String,
  reason: String,
  suggestedAction: String,
  messages: [mongoose.Schema.Types.Mixed],
  meeting: mongoose.Schema.Types.Mixed,
  source: { type: String, default: 'demo' },
}, { timestamps: true, strict: false });

const IntegrationSchema = new mongoose.Schema({
  workspaceId: { type: String, default: 'default-workspace', index: true },
  provider: { type: String, required: true },
  accountEmail: String,
  encryptedTokens: String,
  connectedAt: Date,
  lastSyncedAt: Date,
  status: { type: String, default: 'connected' },
}, { timestamps: true });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
const Integration = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);

let dbReady = false;
let dbConnectionPromise = null;
let memoryConversations = structuredClone(seed);
const memoryIntegrations = new Map();

export async function connectDatabase() {
  if (dbReady || mongoose.connection.readyState === 1) {
    dbReady = true;
    return true;
  }
  if (!process.env.MONGODB_URI) return false;
  if (dbConnectionPromise) return dbConnectionPromise;

  dbConnectionPromise = (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 7000 });
      dbReady = true;
      const count = await Conversation.countDocuments();
      if (count === 0) await Conversation.insertMany(seed);
      console.info('MongoDB connected.');
      return true;
    } catch (error) {
      console.warn('MongoDB unavailable; using in-memory prototype storage:', error.message);
      dbReady = false;
      return false;
    } finally {
      dbConnectionPromise = null;
    }
  })();
  return dbConnectionPromise;
}

export function databaseIsReady() { return dbReady; }

export async function listConversations({ includeArchived = false } = {}) {
  if (dbReady) {
    const query = includeArchived ? {} : { archived: { $ne: true } };
    return Conversation.find(query).sort({ timestamp: -1 }).lean();
  }
  return memoryConversations
    .filter((item) => includeArchived || !item.archived)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getConversation(id) {
  if (dbReady) return Conversation.findOne({ id }).lean();
  return memoryConversations.find((item) => item.id === id) || null;
}

export async function upsertConversation(conversation) {
  if (dbReady) {
    await Conversation.findOneAndUpdate({ id: conversation.id }, { $set: conversation }, { upsert: true, new: true });
    return Conversation.findOne({ id: conversation.id }).lean();
  }
  const index = memoryConversations.findIndex((item) => item.id === conversation.id);
  if (index >= 0) memoryConversations[index] = { ...memoryConversations[index], ...conversation };
  else memoryConversations.unshift(conversation);
  return memoryConversations.find((item) => item.id === conversation.id);
}

export async function updateConversation(id, patch) {
  if (dbReady) {
    const allowed = {};
    for (const key of ['unread', 'important', 'archived', 'completed', 'responsibility', 'category', 'summary', 'reason', 'suggestedAction', 'confidence', 'priority']) {
      if (Object.hasOwn(patch, key)) allowed[key] = patch[key];
    }
    if (Object.hasOwn(patch, 'responsibility')) {
      allowed.manualOverride = true;
      allowed.reason = 'Manually assigned by a workspace member. This decision is preserved until a newer message arrives.';
    }
    return Conversation.findOneAndUpdate({ id }, { $set: allowed }, { new: true }).lean();
  }
  const item = memoryConversations.find((entry) => entry.id === id);
  if (!item) return null;
  const editable = ['unread', 'important', 'archived', 'completed', 'responsibility', 'category', 'summary', 'reason', 'suggestedAction', 'confidence', 'priority'];
  for (const key of editable) if (Object.hasOwn(patch, key)) item[key] = patch[key];
  if (Object.hasOwn(patch, 'responsibility')) {
    item.manualOverride = true;
    item.reason = 'Manually assigned by a workspace member. This decision is preserved until a newer message arrives.';
  }
  return item;
}

function encryptionKey() {
  const value = process.env.TOKEN_ENCRYPTION_KEY || '';
  if (!/^[a-fA-F0-9]{64}$/.test(value)) return null;
  return Buffer.from(value, 'hex');
}

function encrypt(value) {
  const key = encryptionKey();
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY must be set to a 64-character hex key before Gmail credentials can be persisted in MongoDB.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join('.');
}

function decrypt(value) {
  const key = encryptionKey();
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is missing or invalid.');
  const [ivHex, tagHex, dataHex] = value.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plain = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

export async function saveIntegration(provider, accountEmail, tokens) {
  if (process.env.NODE_ENV === 'production' && !dbReady) {
    throw new Error('Gmail cannot be connected in production until MongoDB is configured. Add MONGODB_URI and TOKEN_ENCRYPTION_KEY, then redeploy.');
  }
  const record = {
    provider,
    accountEmail,
    connectedAt: new Date(),
    status: 'connected',
    lastSyncedAt: null,
  };
  if (dbReady) {
    record.encryptedTokens = encrypt(tokens);
    await Integration.findOneAndUpdate(
      { workspaceId: 'default-workspace', provider },
      { $set: record, $setOnInsert: { workspaceId: 'default-workspace' } },
      { upsert: true, new: true },
    );
  } else {
    // Process-memory storage is suitable for local demos only. MongoDB + encryption is required for durable deployment.
    memoryIntegrations.set(provider, { ...record, tokens });
  }
  return publicIntegration(record);
}

export async function getIntegration(provider) {
  if (dbReady) {
    const record = await Integration.findOne({ workspaceId: 'default-workspace', provider }).lean();
    if (!record) return null;
    return { ...record, tokens: decrypt(record.encryptedTokens) };
  }
  return memoryIntegrations.get(provider) || null;
}

export async function listIntegrations() {
  if (dbReady) {
    const records = await Integration.find({ workspaceId: 'default-workspace' }).lean();
    return records.map(publicIntegration);
  }
  return [...memoryIntegrations.values()].map(publicIntegration);
}

export async function updateIntegrationSync(provider) {
  const now = new Date();
  if (dbReady) await Integration.updateOne({ workspaceId: 'default-workspace', provider }, { $set: { lastSyncedAt: now } });
  else {
    const record = memoryIntegrations.get(provider);
    if (record) record.lastSyncedAt = now;
  }
}

export async function removeIntegration(provider) {
  if (dbReady) await Integration.deleteOne({ workspaceId: 'default-workspace', provider });
  else memoryIntegrations.delete(provider);
}

function publicIntegration(record) {
  if (!record) return null;
  return {
    provider: record.provider,
    accountEmail: record.accountEmail,
    connectedAt: record.connectedAt,
    lastSyncedAt: record.lastSyncedAt,
    status: record.status,
  };
}
