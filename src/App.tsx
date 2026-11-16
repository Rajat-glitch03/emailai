import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Bell, ChevronDown, Command, Inbox, Menu, Search, Settings2, Sparkles, UserRound } from 'lucide-react';
import seedData from './data/demo-conversations.json';
import type { AppConfig, Conversation, Integration, Responsibility } from './types';
import { api } from './lib/api';
import Sidebar, { type SectionKey } from './components/Sidebar';
import Overview from './components/Overview';
import ConversationList from './components/ConversationList';
import ConversationDetail from './components/ConversationDetail';
import ClientWorkspace from './components/ClientWorkspace';
import ConnectPanel from './components/ConnectPanel';
import CopilotDrawer from './components/CopilotDrawer';
import Welcome from './components/Welcome';

const initialConversations = seedData as Conversation[];

const sectionMeta: Record<Exclude<SectionKey, 'client-view'>, { title: string; description: string }> = {
  overview: { title: 'Overview', description: 'A considered view of what is happening across your inbox.' },
  inbox: { title: 'All conversations', description: 'Every conversation, with a clear owner and a useful next step.' },
  assistant: { title: 'Assigned to me', description: 'Routine replies, scheduling and follow-ups your assistant can move forward.' },
  client: { title: 'Client attention', description: 'Decisions and conversations that need your personal input.' },
  waiting: { title: 'Waiting for reply', description: 'Conversations where the next move is still outstanding.' },
  meetings: { title: 'Meetings & appointments', description: 'Scheduling requests and events found in your conversations.' },
  important: { title: 'Important', description: 'Messages worth keeping close, even when no action is needed.' },
  archive: { title: 'Archive', description: 'Completed conversations kept for reference.' },
};

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [section, setSection] = useState<SectionKey>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [gmail, setGmail] = useState<Integration | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('tandem:onboarded') === 'true');

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    setToastKey((value) => value + 1);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    try {
      const [items, nextConfig, status] = await Promise.all([api.conversations(true), api.config(), api.gmailStatus()]);
      setConversations(items);
      setConfig(nextConfig);
      setGmail(status.integration);
      setSelectedId((current) => current || items.find((item) => !item.archived)?.id || null);
    } catch {
      // Sample data keeps the prototype explorable even before a backend or database is configured.
      setConfig({ appName: 'Tandem', aiMode: 'Demo intelligence', gmail: { configured: false, scopes: [], mode: 'read_only' }, outlook: { configured: false, mode: 'simulated', note: 'Prototype connection only.' } });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refreshWorkspace(); }, [refreshWorkspace]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailResult = params.get('gmail');
    if (gmailResult === 'connected') {
      setOnboarded(true);
      localStorage.setItem('tandem:onboarded', 'true');
      toast(`Gmail connected${params.get('account') ? ` · ${params.get('account')}` : ''}. Sync your inbox to continue.`);
      void refreshWorkspace();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (gmailResult === 'error') {
      toast(params.get('message') || 'Gmail authorization could not be completed.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshWorkspace, toast]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), 3600);
    return () => window.clearTimeout(timer);
  }, [toastKey, toastMessage]);

  const selectedConversation = conversations.find((item) => item.id === selectedId) || null;
  const isClientView = section === 'client-view';

  const visibleConversations = useMemo(() => {
    let items = [...conversations];
    switch (section) {
      case 'inbox': items = items.filter((item) => !item.archived); break;
      case 'assistant': items = items.filter((item) => !item.archived && !item.completed && item.responsibility === 'assistant_to_reply'); break;
      case 'client': items = items.filter((item) => !item.archived && !item.completed && item.responsibility === 'client_to_reply'); break;
      case 'waiting': items = items.filter((item) => !item.archived && !item.completed && ['assistant_to_reply', 'client_to_reply'].includes(item.responsibility)); break;
      case 'meetings': items = items.filter((item) => !item.archived && !item.completed && item.category === 'Meetings'); break;
      case 'important': items = items.filter((item) => !item.archived && item.important); break;
      case 'archive': items = items.filter((item) => item.archived); break;
      default: items = items.filter((item) => !item.archived);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((item) => [item.sender, item.senderEmail, item.subject, item.preview, item.summary].join(' ').toLowerCase().includes(q));
    }
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [conversations, section, query]);

  const updateConversation = useCallback(async (id: string, patch: Partial<Conversation>) => {
    setConversations((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    try {
      const saved = await api.updateConversation(id, patch);
      setConversations((current) => current.map((item) => item.id === id ? { ...item, ...saved } : item));
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save that change.');
    }
  }, [toast]);

  const markRowImportant = (item: Conversation) => void updateConversation(item.id, { important: !item.important });
  const markRowUnread = (item: Conversation) => void updateConversation(item.id, { unread: !item.unread });
  const openConversation = (id: string) => {
    setSelectedId(id);
    setSection('inbox');
    setQuery('');
  };
  const connectAndEnter = () => { setOnboarded(true); localStorage.setItem('tandem:onboarded', 'true'); setConnectOpen(true); };
  const enterDemo = () => { setOnboarded(true); localStorage.setItem('tandem:onboarded', 'true'); setSection('overview'); };

  const handleSyncGmail = async () => {
    const result = await api.syncGmail();
    toast(`Synced ${result.synced} conversations from ${result.accountEmail}.`);
    await refreshWorkspace();
  };
  const handleDisconnectGmail = async () => { await api.disconnectGmail(); setGmail(null); await refreshWorkspace(); };
  const handleOutlookDemo = async () => { await api.connectOutlookDemo(); };

  const contentTitle = section === 'client-view' ? 'Client view' : sectionMeta[section].title;
  const pageHeading = section === 'client-view' ? 'Client view' : sectionMeta[section].title;
  const activeCount = conversations.filter((item) => !item.archived && !item.completed).length;

  if (!onboarded) return <>
    <Welcome onEnter={enterDemo} onConnect={connectAndEnter} />
    {connectOpen && <ConnectPanel config={config} gmail={gmail} onClose={() => setConnectOpen(false)} onSync={handleSyncGmail} onDisconnect={handleDisconnectGmail} onOutlookDemo={handleOutlookDemo} toast={toast} />}
    {toastMessage && <div className="toast-message"><span className="toast-check">✓</span>{toastMessage}</div>}
  </>;

  return <div className={`app-shell ${isClientView ? 'client-mode-shell' : ''}`}>
    {!isClientView && <Sidebar section={section} onChange={setSection} conversations={conversations} onConnect={() => setConnectOpen(true)} onSettings={() => setConnectOpen(true)} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} clientMode={false} />}
    <main className={`main-area ${isClientView ? 'main-client-area' : ''}`}>
      {isClientView ? <div className="client-portal-bar"><button className="quiet-button" onClick={() => setSection('overview')}><ArrowLeft size={14} />Back to assistant workspace</button><div className="portal-account"><span className="portal-client-avatar">OC</span><span>Olivia Chen</span><ChevronDown size={14} /></div></div> : <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div className="breadcrumbs"><span>Northstar Studio</span><span>/</span><strong>{contentTitle}</strong></div></div>
        <div className="topbar-actions"><div className="global-search"><Search size={15} /><input value={query} onChange={(event) => { setQuery(event.target.value); if (section === 'overview') setSection('inbox'); }} placeholder="Search conversations" aria-label="Search all conversations" /><kbd><Command size={10} /> K</kbd></div><button className="topbar-ai-button" onClick={() => setCopilotOpen(true)}><Sparkles size={14} />Ask inbox</button><button className="icon-button topbar-bell" aria-label="Notifications" onClick={() => toast('You are up to date.')}><Bell size={17} /><i /></button><button className="topbar-profile" onClick={() => setSection('client-view')}><span>OC</span><ChevronDown size={13} /></button></div>
      </header>}

      {isClientView ? <ClientWorkspace conversations={conversations} onPatch={updateConversation} toast={toast} /> : <div className="page-content">
        {section === 'overview' ? <Overview conversations={conversations} onOpen={openConversation} onNavigate={setSection} /> : <>
          <div className="page-heading-row"><div><span className="eyebrow">{section === 'inbox' ? 'YOUR WORKSPACE' : 'INBOX SEGMENT'}</span><h1>{pageHeading}<span>.</span></h1><p>{sectionMeta[section].description}</p></div><div className="page-heading-actions"><span className="count-chip">{visibleConversations.length} conversations</span><button className="secondary-button" onClick={() => setConnectOpen(true)}><Mail size={14} />Connect account</button></div></div>
          <div className="inbox-workspace">
            <ConversationList conversations={visibleConversations} selectedId={selectedId} onSelect={setSelectedId} query={query} onQueryChange={setQuery} onToggleImportant={markRowImportant} onToggleUnread={markRowUnread} title={sectionMeta[section].title} />
            <ConversationDetail conversation={selectedConversation && visibleConversations.some((item) => item.id === selectedId) ? selectedConversation : visibleConversations[0] || null} onPatch={updateConversation} onClassify={async (id) => { const updated = await api.reclassify(id); setConversations((current) => current.map((item) => item.id === id ? updated : item)); return updated; }} onDraft={api.draft} onSummarize={api.summarize} onBack={() => setSelectedId(null)} toast={toast} />
          </div>
        </>}
      </div>}
      {!isClientView && <footer className="app-footer"><span>© 2026 Tandem Workspace</span><span>{config?.aiMode || 'Demo intelligence'} <i /> {gmail ? `Connected to ${gmail.accountEmail}` : `${activeCount} active conversations`}</span></footer>}
    </main>
    {connectOpen && <ConnectPanel config={config} gmail={gmail} onClose={() => setConnectOpen(false)} onSync={handleSyncGmail} onDisconnect={handleDisconnectGmail} onOutlookDemo={handleOutlookDemo} toast={toast} />}
    {copilotOpen && <CopilotDrawer onClose={() => setCopilotOpen(false)} onAsk={api.ask} onOpenConversation={(id) => { setCopilotOpen(false); openConversation(id); }} />}
    {toastMessage && <div className="toast-message" key={toastKey}><span className="toast-check">✓</span>{toastMessage}</div>}
    {loading && <div className="loading-status"><span className="loading-dots"><i /><i /><i /></span>Loading workspace</div>}
  </div>;
}
