import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3, Mail, Sparkles, UserRound } from 'lucide-react';
import type { Conversation } from '../types';
import { formatFullDate, formatTime } from '../lib/format';
import ResponsibilityBadge from './ResponsibilityBadge';

interface Props {
  conversations: Conversation[];
  onPatch: (id: string, patch: Partial<Conversation>) => Promise<void>;
  toast: (message: string) => void;
}

export default function ClientWorkspace({ conversations, onPatch, toast }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const attention = conversations.filter((item) => !item.archived && !item.completed && item.responsibility === 'client_to_reply').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const handle = async (item: Conversation, delegate: boolean) => {
    await onPatch(item.id, delegate ? { responsibility: 'assistant_to_reply', unread: false } : { completed: true, unread: false });
    toast(delegate ? 'The assistant has taken ownership of this conversation.' : 'Marked as handled. It remains in the assistant’s All conversations view.');
  };
  return <div className="client-workspace">
    <div className="client-topline"><span className="client-topline-mark"><UserRound size={15} /></span><span>CLIENT PORTAL</span><span className="client-topline-divider" /><span>Northstar Studio</span></div>
    <div className="client-hero"><div><span className="eyebrow">YOUR PERSONAL BRIEF</span><h1>A little more room<br />for what matters.</h1><p>Your assistant has sorted the inbox. These are the conversations that need your perspective.</p></div><div className="client-hero-art"><div className="art-paper paper-back" /><div className="art-paper paper-front"><div className="art-paper-line wide" /><div className="art-paper-line" /><div className="art-paper-line medium" /><div className="art-paper-stamp"><Check size={15} /></div></div><span className="art-small-dot" /></div></div>
    <div className="client-stat-strip"><div><strong>{attention.length.toString().padStart(2, '0')}</strong><span>Awaiting your attention</span></div><div><strong>{conversations.filter((item) => item.completed).length.toString().padStart(2, '0')}</strong><span>Handled to date</span></div><div className="client-stat-note"><Clock3 size={15} /><span>Your assistant keeps the rest moving.</span></div></div>
    <div className="client-section-head"><div><span className="eyebrow">NEEDS YOUR PERSPECTIVE</span><h2>Over to you</h2><p>Only the conversations where your input makes a difference.</p></div><span className="client-quiet-count">{attention.length} to review</span></div>
    {attention.length ? <div className="client-attention-list">{attention.map((item) => <article className={`client-attention-card ${expandedId === item.id ? 'expanded' : ''}`} key={item.id}>
      <div className="client-card-main"><div className="conversation-avatar client-avatar">{item.avatar}</div><div className="client-card-copy"><div className="client-sender-row"><strong>{item.sender}</strong><span>{formatTime(item.timestamp)}</span></div><h3>{item.subject}</h3><p>{item.summary}</p><button className="why-link" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>{expandedId === item.id ? 'Hide conversation' : 'Why this needs you'} <ChevronDown size={13} className={expandedId === item.id ? 'rotate-up' : ''} /></button></div><ResponsibilityBadge value="client_to_reply" compact /></div>
      {expandedId === item.id && <div className="client-expanded-content"><div className="client-reason"><span>WHY IT'S WITH YOU</span><p>{item.reason}</p></div><div className="client-message-preview"><span>ORIGINAL MESSAGE</span><p>{item.messages.at(-1)?.body || item.preview}</p><small>{item.sender} · {formatFullDate(item.timestamp)}</small></div><div className="client-expanded-actions"><button className="secondary-button" onClick={() => handle(item, true)}><ArrowRight size={14} />Ask my assistant to take this</button><button className="primary-button small-primary" onClick={() => handle(item, false)}><Check size={14} />I've handled this</button></div></div>}
    </article>)}</div> : <div className="client-clear-state"><div className="clear-state-icon"><Check size={24} /></div><h3>You're all caught up.</h3><p>There are no conversations waiting for your personal response. Your assistant has the rest covered.</p></div>}
    <div className="client-footer-note"><Sparkles size={14} /><span>Anything you delegate or mark handled is reflected in your assistant's workspace.</span></div>
  </div>;
}
