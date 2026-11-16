import { ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Inbox, MoveUpRight, UserRound, UsersRound } from 'lucide-react';
import type { Conversation } from '../types';
import { formatTime } from '../lib/format';
import ResponsibilityBadge from './ResponsibilityBadge';
import type { SectionKey } from './Sidebar';

interface Props {
  conversations: Conversation[];
  onOpen: (id: string) => void;
  onNavigate: (section: SectionKey) => void;
}

export default function Overview({ conversations, onOpen, onNavigate }: Props) {
  const active = conversations.filter((item) => !item.archived && !item.completed);
  const client = active.filter((item) => item.responsibility === 'client_to_reply');
  const assistant = active.filter((item) => item.responsibility === 'assistant_to_reply');
  const unread = active.filter((item) => item.unread);
  const upcoming = active.filter((item) => item.meeting).sort((a, b) => new Date(a.meeting!.date).getTime() - new Date(b.meeting!.date).getTime()).slice(0, 3);
  const attention = [...client, ...assistant].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 4);
  const date = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return <div className="overview-page">
    <div className="overview-welcome"><div><span className="eyebrow">{date.toUpperCase()}</span><h1>Good morning, Olivia<span>.</span></h1><p>Here's what needs your attention today.</p></div><button className="primary-button" onClick={() => onNavigate('inbox')}><Inbox size={15} />Open inbox <ArrowUpRight size={14} /></button></div>
    <div className="overview-metrics">
      <button className="metric-card metric-total" onClick={() => onNavigate('inbox')}><div className="metric-top"><span>Open conversations</span><Inbox size={17} /></div><strong>{active.length.toString().padStart(2, '0')}</strong><small>Across your connected inbox</small><span className="metric-link">View inbox <ArrowRight size={13} /></span></button>
      <button className="metric-card" onClick={() => onNavigate('assistant')}><div className="metric-top"><span>With your assistant</span><ArrowRight size={16} /></div><strong>{assistant.length.toString().padStart(2, '0')}</strong><small>Routine replies and follow-ups</small><span className="metric-link">Review assigned <ArrowRight size={13} /></span></button>
      <button className="metric-card" onClick={() => onNavigate('client')}><div className="metric-top"><span>Your attention</span><UserRound size={17} /></div><strong>{client.length.toString().padStart(2, '0')}</strong><small>Decisions only you can make</small><span className="metric-link">See what needs you <ArrowRight size={13} /></span></button>
      <button className="metric-card" onClick={() => onNavigate('inbox')}><div className="metric-top"><span>Unread</span><MailIcon /></div><strong>{unread.length.toString().padStart(2, '0')}</strong><small>New since your last review</small><span className="metric-link">Catch up <ArrowRight size={13} /></span></button>
    </div>
    <div className="overview-content-grid">
      <section className="overview-card attention-card"><div className="overview-card-head"><div><span className="eyebrow">THE SHORTLIST</span><h2>Needs a next step</h2></div><button className="quiet-button" onClick={() => onNavigate('inbox')}>View all <ArrowRight size={14} /></button></div>
        {attention.length ? attention.map((item) => <button className="attention-row" key={item.id} onClick={() => onOpen(item.id)}><div className="conversation-avatar">{item.avatar}</div><div className="attention-row-copy"><strong>{item.sender}</strong><span>{item.subject}</span><small>{item.suggestedAction}</small></div><div className="attention-row-side"><ResponsibilityBadge value={item.responsibility} compact /><time>{formatTime(item.timestamp)}</time></div><ArrowUpRight size={14} className="attention-arrow" /></button>) : <div className="mini-empty">All clear. Nothing needs a next step.</div>}
      </section>
      <section className="overview-card schedule-card"><div className="overview-card-head"><div><span className="eyebrow">COMING UP</span><h2>On the calendar</h2></div><CalendarDays size={17} className="muted-icon" /></div>
        {upcoming.length ? upcoming.map((item) => <button className="schedule-row" key={item.id} onClick={() => onOpen(item.id)}><div className="schedule-date"><strong>{new Intl.DateTimeFormat('en', { day: '2-digit' }).format(new Date(item.meeting!.date))}</strong><span>{new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(item.meeting!.date)).toUpperCase()}</span></div><div className="schedule-copy"><strong>{item.meeting!.label}</strong><span>{item.sender} · {new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(item.meeting!.date))}</span></div><ArrowUpRight size={14} /></button>) : <div className="mini-empty">No upcoming meetings found.</div>}
        <div className="schedule-note"><Clock3 size={13} />Extracted from your email conversations</div>
      </section>
    </div>
    <div className="overview-bottom-strip"><div className="bottom-strip-icon"><CheckCircle2 size={18} /></div><div><strong>A calmer way to stay on top of things.</strong><p>Your assistant owns the coordination. You stay close to the decisions.</p></div><button className="quiet-button" onClick={() => onNavigate('client')}>Preview client view <MoveUpRight size={14} /></button></div>
  </div>;
}

function MailIcon() { return <UsersRound size={17} />; }
