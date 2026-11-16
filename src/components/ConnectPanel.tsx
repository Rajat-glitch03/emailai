import { useState } from 'react';
import { ArrowUpRight, CheckCircle2, ChevronDown, CircleAlert, ExternalLink, Link2, Mail, RefreshCw, ShieldCheck, Unplug, X } from 'lucide-react';
import type { AppConfig, Integration } from '../types';

interface Props {
  config: AppConfig | null;
  gmail: Integration | null;
  onClose: () => void;
  onSync: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onOutlookDemo: () => Promise<void>;
  toast: (message: string) => void;
}

export default function ConnectPanel({ config, gmail, onClose, onSync, onDisconnect, onOutlookDemo, toast }: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [outlookPreview, setOutlookPreview] = useState(false);
  const gmailConfigured = Boolean(config?.gmail.configured);
  const sync = async () => { setSyncing(true); try { await onSync(); } catch (error) { toast(error instanceof Error ? error.message : 'Gmail sync failed.'); } finally { setSyncing(false); } };
  const disconnect = async () => { setDisconnecting(true); try { await onDisconnect(); toast('Gmail disconnected from this workspace.'); } catch { toast('Could not disconnect Gmail.'); } finally { setDisconnecting(false); } };
  return <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="connect-modal" role="dialog" aria-modal="true" aria-labelledby="connect-title">
      <div className="modal-topbar"><div className="modal-brand-mark"><Link2 size={16} /></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <div className="modal-intro"><span className="eyebrow">CONNECTED ACCOUNTS</span><h2 id="connect-title">Bring your inbox<br />into good hands.</h2><p>Connect an email account to keep your conversations organized in one considered workspace.</p></div>
      <div className="integration-option">
        <div className="integration-brand google-brand">G</div><div className="integration-copy"><strong>Google Gmail</strong><span>{gmail ? gmail.accountEmail : 'Connect a Google account'}</span>{gmail && <small className="connected-line"><span className="status-dot" />Connected{gmail.lastSyncedAt ? ` · Synced ${new Date(gmail.lastSyncedAt).toLocaleString()}` : ''}</small>}</div>
        {gmail ? <div className="integration-actions"><button className="secondary-button compact-button" onClick={sync} disabled={syncing}><RefreshCw size={13} className={syncing ? 'spin' : ''} />{syncing ? 'Syncing…' : 'Sync now'}</button><button className="icon-button" onClick={disconnect} disabled={disconnecting} title="Disconnect Gmail"><Unplug size={15} /></button></div> : <button className="primary-button compact-button" disabled={!gmailConfigured} onClick={() => { window.location.assign('/api/integrations/gmail/connect'); }}>Connect <ArrowUpRight size={14} /></button>}
      </div>
      {!gmail && !gmailConfigured && <div className="setup-needed"><CircleAlert size={16} /><div><strong>One-time setup needed</strong><span>Add your Google OAuth credentials to the project environment before connecting an account.</span><button onClick={() => setShowGuide((value) => !value)}>{showGuide ? 'Hide setup steps' : 'Show setup steps'} <ChevronDown size={13} className={showGuide ? 'rotate-up' : ''} /></button></div></div>}
      {showGuide && <div className="setup-guide"><ol><li>Create a project in Google Cloud Console and enable the Gmail API.</li><li>Configure the OAuth consent screen and add your Google account as a test user.</li><li>Create an OAuth client for a Web application.</li><li>Set the authorized redirect URI to <code>{window.location.origin}/api/integrations/gmail/callback</code>.</li><li>Add <code>GMAIL_CLIENT_ID</code>, <code>GMAIL_CLIENT_SECRET</code> and <code>GMAIL_REDIRECT_URI</code> to your local environment or Vercel project.</li></ol><a href="https://developers.google.com/workspace/gmail/api/auth/web-server" target="_blank" rel="noreferrer">Google's server-side OAuth guide <ExternalLink size={12} /></a></div>}
      <div className="integration-option outlook-option">
        <div className="integration-brand outlook-brand"><span>O</span></div><div className="integration-copy"><strong>Microsoft Outlook</strong><span>{outlookPreview ? 'Prototype flow previewed' : 'Microsoft 365 and Outlook'}</span><small className="prototype-line">Prototype connection · not linked to a live mailbox</small></div><button className="secondary-button compact-button" onClick={async () => { await onOutlookDemo(); setOutlookPreview(true); toast('Outlook prototype flow previewed. No mailbox was connected.'); }}>{outlookPreview ? 'Previewed' : 'Preview flow'}</button>
      </div>
      <div className="permissions-note"><ShieldCheck size={15} /><p><strong>Privacy by design.</strong> Gmail uses read-only access in this prototype. The app does not send, delete or modify messages in your mailbox. Generated replies stay as drafts in this browser until you choose what to do with them.</p></div>
      <div className="modal-footer"><span><CheckCircle2 size={13} /> You stay in control of every reply.</span><button className="quiet-button" onClick={onClose}>Done</button></div>
    </section>
  </div>;
}
