import { useState } from 'react';
import { ArrowRight, ArrowUpRight, MessageCircle, Sparkles, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onAsk: (question: string) => Promise<{ answer: string; conversationIds: string[]; source: string }>;
  onOpenConversation: (id: string) => void;
}

const suggestions = ['Which emails need my attention?', 'What am I waiting for a response on?', 'Show me important conversations'];

export default function CopilotDrawer({ onClose, onAsk, onOpenConversation }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ answer: string; conversationIds: string[]; source: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async (value = question) => {
    if (!value.trim()) return;
    setQuestion(value);
    setLoading(true);
    try { setAnswer(await onAsk(value)); } catch (error) { setAnswer({ answer: error instanceof Error ? error.message : 'I could not review the inbox right now.', conversationIds: [], source: 'error' }); }
    finally { setLoading(false); }
  };
  return <div className="copilot-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="copilot-drawer">
      <div className="copilot-header"><div className="copilot-heading-icon"><Sparkles size={16} /></div><div><strong>Ask your inbox</strong><span>Find the signal in your conversations</span></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <div className="copilot-body"><div className="copilot-welcome"><div className="copilot-large-icon"><MessageCircle size={20} /></div><h2>What would you like<br />to know?</h2><p>Ask a question in plain language. Tandem will look across the conversations in this workspace.</p></div>
        {!answer && <div className="copilot-suggestions"><span className="eyebrow">TRY ASKING</span>{suggestions.map((item) => <button key={item} onClick={() => submit(item)}>{item}<ArrowUpRight size={14} /></button>)}</div>}
        {loading && <div className="copilot-loading"><span className="loading-dots"><i /><i /><i /></span>Looking through your inbox…</div>}
        {answer && !loading && <div className="copilot-answer"><div className="answer-label"><Sparkles size={13} /> INBOX BRIEF <span>{answer.source === 'gemini' ? 'Gemini' : 'Demo intelligence'}</span></div><p>{answer.answer}</p>{answer.conversationIds.length > 0 && <div className="answer-results"><span>RELATED CONVERSATIONS</span>{answer.conversationIds.map((id) => <button key={id} onClick={() => onOpenConversation(id)}>Open conversation <ArrowRight size={13} /></button>)}</div>}<button className="quiet-button ask-again" onClick={() => { setAnswer(null); setQuestion(''); }}>Ask another question</button></div>}
      </div>
      <form className="copilot-input-area" onSubmit={(event) => { event.preventDefault(); submit(); }}><textarea rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask something about your inbox…" /><div><span>Answers are based on connected workspace conversations.</span><button className="copilot-send" type="submit" disabled={!question.trim() || loading}><ArrowUpRight size={16} /></button></div></form>
    </aside>
  </div>;
}
