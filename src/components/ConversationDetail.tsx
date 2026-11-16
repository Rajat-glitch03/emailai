import { useEffect, useState } from 'react';
import { Archive, ArrowLeft, ArrowUpRight, CalendarClock, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Copy, FileText, Flag, Mail, MoreHorizontal, Paperclip, RefreshCw, Send, Sparkles, Star, UserRound, WandSparkles } from 'lucide-react';
import type { Conversation, Responsibility } from '../types';
import ResponsibilityBadge from './ResponsibilityBadge';
import { formatFullDate } from '../lib/format';

interface Props {
  conversation: Conversation | null;
  onPatch: (id: string, patch: Partial<Conversation>) => Promise<void>;
  onClassify: (id: string) => Promise<Conversation>;
  onDraft: (id: string) => Promise<{ subject: string; body: string; notes: string; source: string }>;
  onSummarize: (id: string) => Promise<{ summary: string; keyPoints: string[]; nextStep: string; source: string }>;
  onBack: () => void;
  toast: (message: string) => void;
}

const responsibilityLabels: Record<Responsibility, string> = {
  assistant_to_reply: 'Assistant to reply',
  client_to_reply: 'Client to reply',
  no_reply_needed: 'No reply needed',
  needs_review: 'Needs review',
};

export default function ConversationDetail({ conversation, onPatch, onClassify, onDraft, onSummarize, onBack, toast }: Props) {
  const [draft, setDraft] = useState<{ subject: string; body: string; notes: string; source: string } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(true);

  useEffect(() => { setDraft(null); setSummary(null); setShowAllMessages(true); }, [conversation?.id]);

  if (!conversation) return <div className="detail-empty"><div className="detail-empty-mark"><Mail size={23} /></div><h3>Choose a conversation</h3><p>Select an email from the list to see the full conversation and its next steps.</p></div>;

  const patch = (value: Partial<Conversation>) => onPatch(conversation.id, value);
  const makeDraft = async () => {
    setDrafting(true);
    try { setDraft(await onDraft(conversation.id)); toast('A reply draft is ready for your review.'); }
    catch { toast('Could not create a draft. Check your AI configuration.'); }
    finally { setDrafting(false); }
  };
  const makeClassification = async () => {
    setClassifying(true);
    try { await onClassify(conversation.id); toast('Responsibility classification refreshed.'); }
    catch { toast('Could not re-check this conversation.'); }
    finally { setClassifying(false); }
  };
  const makeSummary = async () => {
    setSummarizing(true);
    try { const result = await onSummarize(conversation.id); setSummary(result.summary); toast(result.source === 'gemini' ? 'Conversation summary refreshed.' : 'Demo summary loaded.'); }
    catch { toast('Could not summarize this conversation.'); }
    finally { setSummarizing(false); }
  };
  const saveDraft = () => {
    const saved = JSON.parse(localStorage.getItem('tandem:drafts') || '[]');
    localStorage.setItem('tandem:drafts', JSON.stringify([{ ...draft, conversationId: conversation.id, savedAt: new Date().toISOString() }, ...saved.filter((item: { conversationId: string }) => item.conversationId !== conversation.id)]));
    toast('Draft saved in this browser.');
  };
  const copyDraft = async () => {
    if (!draft) return;
    await navigator.clipboard?.writeText(`${draft.subject}\n\n${draft.body}`);
    toast('Draft copied to clipboard.');
  };

  return <section className="conversation-detail-panel">
    <div className="detail-toolbar">
      <div className="detail-toolbar-left"><button className="icon-button detail-back" onClick={onBack} aria-label="Back to list"><ArrowLeft size={17} /></button><span className="detail-path">Inbox <span>/</span> Conversation</span></div>
      <div className="detail-toolbar-actions">
        <button className={`icon-button ${conversation.important ? 'toolbar-starred' : ''}`} title="Mark important" onClick={() => patch({ important: !conversation.important })}><Star size={17} fill={conversation.important ? 'currentColor' : 'none'} /></button>
        <button className="icon-button" title="Mark unread" onClick={() => patch({ unread: !conversation.unread })}><Mail size={17} /></button>
        <button className="icon-button" title="Archive" onClick={() => { patch({ archived: true }); toast('Conversation archived.'); }}><Archive size={17} /></button>
        <button className="icon-button" title="More options"><MoreHorizontal size={18} /></button>
      </div>
    </div>
    <div className="detail-scroll">
      <div className="detail-subject-block">
        <div className="detail-labels"><span className="eyebrow">CONVERSATION</span>{conversation.important && <span className="important-chip"><Star size={11} fill="currentColor" /> Important</span>}{conversation.source === 'gmail' && <span className="source-tag">Synced from Gmail</span>}</div>
        <h1>{conversation.subject}</h1>
        <div className="detail-from-row"><div className="conversation-avatar large-avatar">{conversation.avatar}</div><div><strong>{conversation.sender}</strong><span>{conversation.senderEmail}</span></div><span className="detail-date">{formatFullDate(conversation.timestamp)}</span></div>
      </div>

      <div className="thread-card">
        <div className="thread-card-head"><div><span className="eyebrow">MESSAGE HISTORY</span><span className="message-count">{conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}</span></div><button className="quiet-button" onClick={() => setShowAllMessages((value) => !value)}>{showAllMessages ? 'Collapse' : 'Expand'} <ChevronDown size={14} className={showAllMessages ? 'rotate-up' : ''} /></button></div>
        {showAllMessages && conversation.messages.map((message, index) => (
          <div className="thread-message" key={`${conversation.id}-${index}`}>
            <div className="thread-avatar">{message.from.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
            <div className="thread-message-content"><div className="thread-message-meta"><strong>{message.from}</strong><span>{message.email}</span><time>{formatFullDate(message.date)}</time></div><p>{message.body}</p></div>
          </div>
        ))}
      </div>

      <div className="ai-insight-card">
        <div className="insight-heading"><div className="insight-icon"><WandSparkles size={16} /></div><div><strong>Conversation brief</strong><span>Prepared to help you decide what happens next</span></div><button className="icon-button insight-refresh" onClick={makeSummary} disabled={summarizing} title="Refresh summary"><RefreshCw size={15} className={summarizing ? 'spin' : ''} /></button></div>
        <p className="insight-summary">{summary || conversation.summary}</p>
        <div className="insight-next-step"><span>Suggested next step</span><p>{conversation.suggestedAction}</p></div>
      </div>

      <div className="reply-section">
        <div className="reply-section-head"><div><span className="eyebrow">REPLY</span><h3>Keep the conversation moving</h3></div><button className="secondary-button compact-button" onClick={makeDraft} disabled={drafting}><Sparkles size={14} />{drafting ? 'Preparing…' : 'Draft with AI'}</button></div>
        {draft ? <div className="draft-editor">
          <div className="draft-topline"><span><Sparkles size={13} /> Suggested draft</span><span className="draft-source">{draft.source === 'gemini' ? 'Gemini' : 'Demo draft'} · Review before use</span></div>
          <input className="draft-subject" value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} aria-label="Draft subject" />
          <textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} rows={7} aria-label="Draft reply" />
          {draft.notes && <p className="draft-note">{draft.notes}</p>}
          <div className="draft-actions"><button className="secondary-button" onClick={copyDraft}><Copy size={14} />Copy draft</button><button className="primary-button small-primary" onClick={saveDraft}><Check size={14} />Save draft</button></div>
        </div> : <div className="reply-placeholder"><div className="reply-placeholder-icon"><FileText size={17} /></div><div><strong>No reply drafted</strong><p>Generate a suggested response, review every detail, then save or copy it.</p></div></div>}
      </div>

      <div className="detail-bottom-space" />
    </div>

    <aside className="detail-inspector">
      <div className="inspector-heading"><span className="eyebrow">TANDEM REVIEW</span><span className="inspector-live"><span className="status-dot" />Live</span></div>
      <div className="responsibility-card">
        <div className="responsibility-card-head"><span>{conversation.manualOverride ? 'MANUAL ASSIGNMENT' : 'REPLY RESPONSIBILITY'}</span><button className="inspector-recheck" onClick={makeClassification} disabled={classifying} title="Re-check responsibility"><RefreshCw size={12} className={classifying ? 'spin' : ''} />{classifying ? 'Checking' : 'Re-check'}</button></div>
        <ResponsibilityBadge value={conversation.responsibility} />
        {!conversation.manualOverride && <><div className="confidence-row"><span>Model confidence</span><strong>{Math.round(conversation.confidence * 100)}%</strong></div><div className="confidence-track"><span style={{ width: `${Math.round(conversation.confidence * 100)}%` }} /></div></>}
        <p className="responsibility-reason">{conversation.reason}</p>
        <label className="field-label" htmlFor="responsibility-select">Change assignment</label>
        <div className="select-wrap"><select id="responsibility-select" value={conversation.responsibility} onChange={(event) => { patch({ responsibility: event.target.value as Responsibility }); toast('Responsibility updated.'); }}>{Object.entries(responsibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={14} /></div>
        <p className="manual-note">{conversation.manualOverride ? 'This manual decision is protected until a newer message arrives.' : 'Your decision always takes precedence over the model’s suggestion.'}</p>
      </div>
      <div className="inspector-info-card"><div className="inspector-card-title"><Flag size={14} /> Priority</div><div className="priority-choice">{(['low', 'medium', 'high'] as const).map((priority) => <button key={priority} className={`priority-choice-item ${conversation.priority === priority ? 'chosen' : ''}`} onClick={() => patch({ priority })}><span className={`priority-dot priority-${priority}`} />{priority}</button>)}</div></div>
      <div className="inspector-info-card"><div className="inspector-card-title"><CalendarClock size={14} /> Follow-up</div><p>{conversation.meeting ? conversation.meeting.label : 'No meeting detected in this conversation.'}</p>{conversation.meeting && <span className="meeting-date">{formatFullDate(conversation.meeting.date)}</span>}</div>
      <div className="inspector-info-card quick-actions-card"><div className="inspector-card-title"><CheckCircle2 size={14} /> Conversation status</div><button className="complete-action" onClick={() => { patch({ completed: !conversation.completed }); toast(conversation.completed ? 'Conversation reopened.' : 'Conversation marked complete.'); }}><span className={`complete-check ${conversation.completed ? 'checked' : ''}`}><Check size={12} /></span>{conversation.completed ? 'Reopen conversation' : 'Mark as completed'}<ArrowUpRight size={13} /></button></div>
      <div className="inspector-footnote"><Clock3 size={13} /> Changes sync to the shared workspace.</div>
    </aside>
  </section>;
}
