"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  X,
  Inbox,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  ArrowDownRight,
} from "lucide-react";

const capabilities = [
  {
    number: "01",
    title: "Know who should answer",
    description: "Tandem reads the conversation and suggests whether you, your client, or nobody needs to reply.",
    icon: Inbox,
  },
  {
    number: "02",
    title: "Keep the important things moving",
    description: "Bring approvals, follow-ups and scheduling requests into one clear view, without losing the context.",
    icon: Clock3,
  },
  {
    number: "03",
    title: "Give clients a quieter inbox",
    description: "Clients see the conversations that genuinely need their judgement — not the entire administrative workload.",
    icon: ShieldCheck,
  },
];

const sampleThreads = [
  { initials: "AM", name: "Alex Morgan", subject: "Re: Q4 planning session", preview: "Could you confirm whether Thursday afternoon works for the review?", time: "10:42", type: "Client attention", tone: "client" },
  { initials: "JL", name: "Jordan Lee", subject: "Updated travel itinerary", preview: "I've attached the revised schedule and hotel confirmation.", time: "09:18", type: "Assistant to reply", tone: "assistant" },
  { initials: "ST", name: "Studio North", subject: "Your monthly design digest", preview: "A few ideas and references selected for this month.", time: "Yesterday", type: "No reply needed", tone: "none" },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="td-landing">
      <header className="td-site-header">
        <div className="td-site-nav">
          <Link href="/" className="td-wordmark" aria-label="Tandem home">
            <span className="td-mark">t.</span>
            <span>tandem</span>
          </Link>
          <nav className={`td-nav-links ${menuOpen ? "is-open" : ""}`}>
            <a href="#approach" onClick={() => setMenuOpen(false)}>The approach</a>
            <a href="#experience" onClick={() => setMenuOpen(false)}>The workspace</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          </nav>
          <div className="td-nav-actions">
            <Link href="/login" className="td-nav-login">Sign in</Link>
            <Link href="/signup" className="td-button td-button-dark td-nav-cta">
              Create an account <ArrowUpRight size={15} />
            </Link>
          </div>
          <button className="td-mobile-menu" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <section className="td-hero">
        <div className="td-hero-grain" aria-hidden="true" />
        <div className="td-hero-inner">
          <div className="td-hero-copy">
            <p className="td-kicker"><span className="td-kicker-line" /> A more considered way to manage email</p>
            <h1>Good communication is a <em>shared responsibility.</em></h1>
            <p className="td-hero-description">
              Tandem gives personal assistants and their clients a calmer way to stay on top of every conversation — with a little intelligence, and a lot more clarity.
            </p>
            <div className="td-hero-cta">
              <Link href="/signup" className="td-button td-button-dark">Get started <ArrowRight size={16} /></Link>
              <a href="#experience" className="td-text-link">Explore the workspace <ArrowDownRight size={15} /></a>
            </div>
            <div className="td-hero-proof">
              <span><Check size={14} /> Clear ownership</span>
              <span><Check size={14} /> Fewer missed follow-ups</span>
              <span><Check size={14} /> Client-first attention</span>
            </div>
          </div>

          <div className="td-hero-visual" id="experience">
            <div className="td-window">
              <div className="td-window-top">
                <div className="td-window-brand"><span className="td-mark td-mark-small">t.</span><strong>tandem</strong><span className="td-window-separator">/</span><span>Assistant workspace</span></div>
                <div className="td-window-status"><i /> Sample inbox</div>
              </div>
              <div className="td-window-body">
                <aside className="td-mini-sidebar">
                  <div className="td-mini-avatar">A</div>
                  <div className="td-mini-nav active"><Inbox size={15} /><span>All mail</span><b>12</b></div>
                  <div className="td-mini-nav"><span className="td-mini-dot sage" /><span>Assistant</span><b>4</b></div>
                  <div className="td-mini-nav"><span className="td-mini-dot rust" /><span>Client</span><b>3</b></div>
                  <div className="td-mini-nav"><span className="td-mini-dot grey" /><span>No reply</span></div>
                  <div className="td-mini-divider" />
                  <div className="td-mini-label">YOUR DAY</div>
                  <div className="td-mini-nav"><CalendarDays size={14} /><span>Meetings</span></div>
                </aside>
                <div className="td-mini-content">
                  <div className="td-mini-content-head">
                    <div><span className="td-mini-overline">MONDAY, 16 NOVEMBER</span><h3>Your inbox, in rhythm.</h3></div>
                    <span className="td-mini-filter">Recent <ChevronDown size={12} /></span>
                  </div>
                  <div className="td-mini-summary">
                    <div><small>Needs your attention</small><strong>04</strong><span>Assistant replies</span></div>
                    <div><small>For your client</small><strong>03</strong><span>Personal decisions</span></div>
                    <div><small>Waiting on others</small><strong>02</strong><span>Follow up soon</span></div>
                  </div>
                  <div className="td-mini-list">
                    {sampleThreads.map((thread) => (
                      <div className="td-mini-thread" key={thread.subject}>
                        <span className="td-mini-thread-avatar">{thread.initials}</span>
                        <div className="td-mini-thread-copy"><strong>{thread.name}</strong><span>{thread.subject}</span><small>{thread.preview}</small></div>
                        <div className="td-mini-thread-meta"><time>{thread.time}</time><span className={`td-status-pill ${thread.tone}`}>{thread.type}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="td-window-foot"><span><Sparkles size={13} /> Intelligence that keeps context in view</span><span>Illustrative preview</span></div>
            </div>
            <div className="td-floating-note"><span className="td-note-icon"><CheckCircle2 size={16} /></span><span><strong>One clear next step</strong><small>Client approval requested</small></span></div>
            <div className="td-visual-caption">A shared view of what matters — and who owns the next move.</div>
          </div>
        </div>
      </section>

      <section className="td-intro-strip" id="approach">
        <div className="td-intro-inner">
          <span className="td-section-label">THE IDEA</span>
          <p>Not another inbox to keep up with. <em>A better way to decide what happens next.</em></p>
          <span className="td-intro-number">01 / 03</span>
        </div>
      </section>

      <section className="td-capabilities td-section" id="how-it-works">
        <div className="td-section-heading">
          <div><span className="td-section-label">A LITTLE MORE CLARITY</span><h2>Less sorting.<br /><em>More forward motion.</em></h2></div>
          <p>Every conversation has a next step. Tandem helps make that step visible, assigns the right owner, and keeps the people involved on the same page.</p>
        </div>
        <div className="td-capability-grid">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return <article className="td-capability" key={item.number}>
              <span className="td-capability-number">{item.number}</span>
              <span className="td-capability-icon"><Icon size={19} strokeWidth={1.7} /></span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="td-capability-rule" />
            </article>;
          })}
        </div>
      </section>

      <section className="td-workflow-section td-section">
        <div className="td-workflow-panel">
          <div className="td-workflow-copy">
            <span className="td-section-label">TWO SIDES. ONE CONVERSATION.</span>
            <h2>Thoughtful support,<br /><em>without the noise.</em></h2>
            <p>The assistant sees the whole picture. The client sees the decisions that belong to them. When responsibility changes, both sides stay in sync.</p>
            <Link href="/signup" className="td-button td-button-light">Make room for clarity <ArrowRight size={15} /></Link>
          </div>
          <div className="td-workflow-visual">
            <div className="td-role-card assistant">
              <div className="td-role-card-head"><span className="td-role-avatar">A</span><span><strong>Assistant view</strong><small>Manage the moving parts</small></span><span className="td-role-tag">Full workspace</span></div>
              <div className="td-role-task"><span className="td-role-check">✓</span><div><strong>Confirm the venue</strong><small>Assistant to reply · Today</small></div></div>
              <div className="td-role-task"><span className="td-role-check">✓</span><div><strong>Send the updated itinerary</strong><small>Assistant to reply · Today</small></div></div>
            </div>
            <div className="td-role-connector"><span /> Shared conversation <ArrowRight size={13} /><span /></div>
            <div className="td-role-card client">
              <div className="td-role-card-head"><span className="td-role-avatar client-avatar">M</span><span><strong>Client view</strong><small>Only what needs your judgement</small></span><span className="td-role-tag client-tag">Personal attention</span></div>
              <div className="td-role-task"><span className="td-role-check rust-check">!</span><div><strong>Approve the revised proposal</strong><small>Client to reply · Needs a decision</small></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="td-final-cta">
        <span className="td-section-label">MAKE EMAIL FEEL MANAGEABLE AGAIN</span>
        <h2>Good work happens<br /><em>when everyone knows their part.</em></h2>
        <Link href="/signup" className="td-button td-button-dark">Create your workspace <ArrowRight size={16} /></Link>
      </section>

      <footer className="td-footer">
        <Link href="/" className="td-wordmark"><span className="td-mark">t.</span><span>tandem</span></Link>
        <span>Considered communication, shared clearly.</span>
        <div><Link href="/login">Sign in</Link><Link href="/signup">Create an account</Link></div>
        <small>© {new Date().getFullYear()} Tandem. A product prototype.</small>
      </footer>
    </main>
  );
}
