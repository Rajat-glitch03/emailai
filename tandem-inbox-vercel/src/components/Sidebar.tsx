import { Archive, ArrowDownLeft, ArrowLeftRight, CalendarDays, ChevronDown, CircleHelp, Clock3, Inbox, LayoutDashboard, MailCheck, Plus, Settings2, Star, UsersRound, X } from 'lucide-react';
import type { Conversation } from '../types';

export type SectionKey = 'overview' | 'inbox' | 'assistant' | 'client' | 'waiting' | 'meetings' | 'important' | 'archive' | 'client-view';

interface Props {
  section: SectionKey;
  onChange: (section: SectionKey) => void;
  conversations: Conversation[];
  onConnect: () => void;
  onSettings: () => void;
  mobileOpen: boolean;
  onClose: () => void;
  clientMode: boolean;
}

export default function Sidebar({ section, onChange, conversations, onConnect, onSettings, mobileOpen, onClose, clientMode }: Props) {
  const active = conversations.filter((item) => !item.archived && !item.completed);
  const count = (filter: (item: Conversation) => boolean) => active.filter(filter).length;
  const primary = [
    { key: 'overview' as const, label: 'Overview', Icon: LayoutDashboard },
    { key: 'inbox' as const, label: 'All conversations', Icon: Inbox, count: count(() => true) },
  ];
  const work = [
    { key: 'assistant' as const, label: 'Assigned to me', Icon: ArrowDownLeft, count: count((item) => item.responsibility === 'assistant_to_reply') },
    { key: 'client' as const, label: 'Client attention', Icon: UsersRound, count: count((item) => item.responsibility === 'client_to_reply') },
    { key: 'waiting' as const, label: 'Waiting for reply', Icon: Clock3, count: count((item) => item.responsibility !== 'no_reply_needed' && item.responsibility !== 'needs_review') },
  ];
  const library = [
    { key: 'meetings' as const, label: 'Meetings', Icon: CalendarDays, count: count((item) => item.category === 'Meetings') },
    { key: 'important' as const, label: 'Important', Icon: Star, count: count((item) => item.important) },
    { key: 'archive' as const, label: 'Archive', Icon: Archive, count: conversations.filter((item) => item.archived).length },
  ];
  const navButton = (item: { key: SectionKey; label: string; Icon: typeof Inbox; count?: number }) => (
    <button key={item.key} className={`nav-item ${section === item.key ? 'active' : ''}`} onClick={() => { onChange(item.key); onClose(); }}>
      <item.Icon size={17} strokeWidth={1.8} />
      <span>{item.label}</span>
      {item.count ? <span className="nav-count">{item.count}</span> : null}
    </button>
  );
  return <>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-row">
        <div className="brand-mark"><span /></div>
        <span className="brand-name">tandem<span>.</span></span>
        <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
      </div>
      <button className="workspace-picker">
        <div className="workspace-avatar">OC</div>
        <span className="workspace-copy"><strong>Northstar Studio</strong><small>Olivia's workspace</small></span>
        <ChevronDown size={15} className="muted-icon" />
      </button>
      <div className="sidebar-scroll">
        <div className="nav-group">
          <div className="nav-label">Workspace</div>
          {primary.map(navButton)}
        </div>
        <div className="nav-group">
          <div className="nav-label">Responsibility</div>
          {work.map(navButton)}
        </div>
        <div className="nav-group">
          <div className="nav-label">Your inbox</div>
          {library.map(navButton)}
        </div>
        <div className="sidebar-account-card">
          <div className="account-card-top"><span className="status-dot" /><span>Workspace status</span><strong>Demo</strong></div>
          <p>Connect an account to bring your real conversations into Tandem.</p>
          <button className="text-button" onClick={onConnect}>Connect email <Plus size={14} /></button>
        </div>
      </div>
      <div className="sidebar-bottom">
        <button className={`nav-item ${clientMode ? 'active' : ''}`} onClick={() => { onChange('client-view'); onClose(); }}><ArrowLeftRight size={17} /><span>Client view</span><span className="view-pill">Preview</span></button>
        <button className="nav-item" onClick={onSettings}><Settings2 size={17} /><span>Settings</span></button>
        <button className="nav-item" onClick={onConnect}><CircleHelp size={17} /><span>Help & connections</span></button>
        <div className="profile-row">
          <div className="profile-avatar">OC</div>
          <span className="profile-copy"><strong>Olivia Chen</strong><small>Personal assistant</small></span>
          <button className="more-button" aria-label="Profile options"><span>•••</span></button>
        </div>
      </div>
    </aside>
  </>;
}
