import { CheckCheck, Circle, Mail, Search, SlidersHorizontal, Star } from 'lucide-react';
import type { Conversation } from '../types';
import ResponsibilityBadge from './ResponsibilityBadge';
import { formatTime } from '../lib/format';

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onToggleImportant: (conversation: Conversation) => void;
  onToggleUnread: (conversation: Conversation) => void;
  title: string;
}

export default function ConversationList({ conversations, selectedId, onSelect, query, onQueryChange, onToggleImportant, onToggleUnread, title }: Props) {
  return <section className="conversation-list-panel">
    <div className="list-panel-head">
      <div><span className="eyebrow">MAILBOX</span><h2>{title}</h2><p>{conversations.length} conversations</p></div>
      <button className="icon-button subtle-button" title="Filters"><SlidersHorizontal size={17} /></button>
    </div>
    <div className="list-search"><Search size={15} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search this list" aria-label="Search conversations" />{query && <button onClick={() => onQueryChange('')} aria-label="Clear search">×</button>}</div>
    <div className="list-columns"><span>CONVERSATION</span><span>RECEIVED</span></div>
    <div className="conversation-scroll">
      {conversations.length === 0 ? <div className="empty-list"><div className="empty-icon"><Mail size={20} /></div><strong>Nothing here just yet</strong><p>When a conversation matches this view, it will appear here.</p></div> : conversations.map((item) => (
        <article key={item.id} className={`conversation-row ${selectedId === item.id ? 'selected' : ''} ${item.unread ? 'unread' : ''}`} onClick={() => onSelect(item.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(item.id); }}>
          <div className="conversation-avatar">{item.avatar}</div>
          <div className="conversation-main">
            <div className="conversation-row-top"><span className="sender-name">{item.sender}</span><span className="conversation-time">{formatTime(item.timestamp)}</span></div>
            <div className="subject-line">{item.subject}</div>
            <p className="conversation-preview">{item.preview}</p>
            <div className="conversation-meta"><ResponsibilityBadge value={item.responsibility} compact /><span className={`priority-dot priority-${item.priority}`} title={`${item.priority} priority`} />{item.category === 'Meetings' && <span className="mini-tag">Meeting</span>}{item.source === 'gmail' && <span className="source-tag">Gmail</span>}{item.completed && <span className="completed-tag">Completed</span>}</div>
          </div>
          <div className="conversation-quick-actions" onClick={(event) => event.stopPropagation()}>
            {item.unread && <Circle size={7} className="unread-indicator" fill="currentColor" />}
            <button className={`row-action ${item.important ? 'is-starred' : ''}`} aria-label={item.important ? 'Remove important' : 'Mark important'} onClick={() => onToggleImportant(item)}><Star size={15} fill={item.important ? 'currentColor' : 'none'} /></button>
            <button className="row-action row-read-action" aria-label={item.unread ? 'Mark read' : 'Mark unread'} onClick={() => onToggleUnread(item)}>{item.unread ? <CheckCheck size={14} /> : <Mail size={14} />}</button>
          </div>
        </article>
      ))}
    </div>
    <div className="list-footer"><span><span className="footer-dot" />Synced just now</span><span>Sorted by newest</span></div>
  </section>;
}
