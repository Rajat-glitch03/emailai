"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Inbox,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  Paperclip,
  Plus,
  Reply,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { onAuthStateChanged, reload, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Responsibility = "assistant" | "client" | "none";
type MailMessage = { id: string; sender: string; email: string; time: string; body: string; outgoing?: boolean };
type MailThread = {
  id: string;
  sender: string;
  email: string;
  initials: string;
  subject: string;
  preview: string;
  time: string;
  date: string;
  category: Responsibility;
  priority: "High" | "Normal" | "Low";
  unread: boolean;
  important: boolean;
  waiting: boolean;
  done: boolean;
  archived?: boolean;
  draft?: boolean;
  summary: string;
  reason: string;
  nextStep: string;
  messages: MailMessage[];
};

const seedThreads: MailThread[] = [
  {
    id: "t1", sender: "Alex Morgan", email: "alex.morgan@northstar.co", initials: "AM",
    subject: "Re: Q4 planning session", preview: "Could you confirm whether Thursday afternoon works for the review?", time: "10:42 AM", date: "Today",
    category: "client", priority: "High", unread: true, important: true, waiting: false, done: false,
    summary: "Alex is finalising the Q4 review and needs the client's confirmation on a Thursday afternoon slot. The preferred time has not been confirmed yet.",
    reason: "Alex is asking for a decision on timing and directs the question to the client.",
    nextStep: "Ask the client to confirm whether Thursday afternoon works.",
    messages: [
      { id: "m1", sender: "Alex Morgan", email: "alex.morgan@northstar.co", time: "Yesterday, 4:18 PM", body: "Hi there,\n\nWe're putting the finishing touches on the Q4 planning review. I have a few things I'd like to walk through with you before the team meeting.\n\nWould Thursday afternoon work on your side?\n\nBest,\nAlex" },
      { id: "m2", sender: "You", email: "assistant@tandem.demo", time: "Yesterday, 4:36 PM", body: "Hi Alex,\n\nThanks for sending this through. I'll check the calendar and come back to you shortly.\n\nBest,\nAssistant", outgoing: true },
      { id: "m3", sender: "Alex Morgan", email: "alex.morgan@northstar.co", time: "Today, 10:42 AM", body: "Thanks. Could you confirm whether Thursday afternoon works for the review? I can keep 2:30 PM open if that suits.", },
    ],
  },
  {
    id: "t2", sender: "Jordan Lee", email: "jordan.lee@wayfarer.com", initials: "JL",
    subject: "Updated travel itinerary", preview: "I've attached the revised schedule and hotel confirmation.", time: "9:18 AM", date: "Today",
    category: "assistant", priority: "Normal", unread: true, important: false, waiting: false, done: false,
    summary: "Jordan has sent the revised travel itinerary and hotel confirmation. No client decision is needed; the assistant can acknowledge receipt and update the calendar.",
    reason: "This is an administrative coordination task that can be handled by the assistant.",
    nextStep: "Acknowledge receipt and add the updated itinerary to the shared calendar.",
    messages: [
      { id: "m1", sender: "Jordan Lee", email: "jordan.lee@wayfarer.com", time: "Today, 9:18 AM", body: "Good morning,\n\nI've attached the revised schedule and hotel confirmation for next week's trip. The earlier flight was no longer available, so I've moved the departure to 8:10 AM.\n\nLet me know if you need anything else from our side.\n\nJordan", },
    ],
  },
  {
    id: "t3", sender: "Maya Chen", email: "maya@fieldwork.studio", initials: "MC",
    subject: "Proposal for the spring campaign", preview: "The revised proposal is ready for your review. I've highlighted the budget changes.", time: "8:56 AM", date: "Today",
    category: "client", priority: "High", unread: true, important: true, waiting: false, done: false,
    summary: "Maya has sent a revised spring campaign proposal and highlighted budget changes. The client needs to review and approve the updated budget before work can proceed.",
    reason: "The proposal contains a commercial decision and explicitly requests the client's approval.",
    nextStep: "Review the revised budget and approve or request changes.",
    messages: [
      { id: "m1", sender: "Maya Chen", email: "maya@fieldwork.studio", time: "Today, 8:56 AM", body: "Hello,\n\nThe revised proposal for the spring campaign is ready for your review. I've highlighted the budget changes on page four and added the updated delivery timeline.\n\nCould you take a look and let me know if you're comfortable for us to proceed?\n\nWarmly,\nMaya" },
    ],
  },
  {
    id: "t4", sender: "Studio North", email: "hello@studionorth.com", initials: "SN",
    subject: "The Field Notes — November edition", preview: "A few thoughtful references and ideas selected for this month.", time: "Yesterday", date: "Yesterday",
    category: "none", priority: "Low", unread: false, important: false, waiting: false, done: false,
    summary: "A monthly editorial newsletter with inspiration and references. No response is expected.",
    reason: "This is an informational newsletter and does not request a reply.",
    nextStep: "No action needed. Keep for reference or archive.",
    messages: [{ id: "m1", sender: "Studio North", email: "hello@studionorth.com", time: "Yesterday, 8:05 AM", body: "The November edition of Field Notes is here — a collection of references, interviews and ideas from the creative community.\n\nWe hope you find something useful in this month's edition." }],
  },
  {
    id: "t5", sender: "Priya Shah", email: "priya.shah@meridianlegal.in", initials: "PS",
    subject: "Documents for signature", preview: "The final copies are attached. Please confirm the signatory details.", time: "Yesterday", date: "Yesterday",
    category: "client", priority: "High", unread: false, important: true, waiting: false, done: false,
    summary: "Meridian Legal has prepared final documents and needs the client to confirm the signatory details before sending them for signature.",
    reason: "The confirmation concerns a legal document and must be approved by the client.",
    nextStep: "Confirm the signatory details with the client before replying.",
    messages: [{ id: "m1", sender: "Priya Shah", email: "priya.shah@meridianlegal.in", time: "Yesterday, 2:24 PM", body: "Hello,\n\nThe final copies are attached. Before we circulate them for signature, could you confirm the signatory details on page two?\n\nPlease let me know if anything needs to be amended.\n\nRegards,\nPriya" }],
  },
  {
    id: "t6", sender: "Daniel Brooks", email: "daniel@atlas-events.com", initials: "DB",
    subject: "Venue hold expires tomorrow", preview: "We can hold the private dining room until 5 PM tomorrow.", time: "Mon", date: "Earlier",
    category: "assistant", priority: "Normal", unread: false, important: false, waiting: true, done: false,
    summary: "The venue has temporarily held the private dining room. The assistant can coordinate the hold and check the guest count.",
    reason: "This is a scheduling and logistics task that does not require a personal decision yet.",
    nextStep: "Confirm the guest count and extend the hold if needed.",
    messages: [{ id: "m1", sender: "Daniel Brooks", email: "daniel@atlas-events.com", time: "Monday, 11:02 AM", body: "We can hold the private dining room until 5 PM tomorrow. The room seats up to fourteen guests. Please let me know if you'd like us to keep the hold in place." }],
  },
  {
    id: "t7", sender: "Finance at Alder", email: "accounts@alderpartners.com", initials: "FA",
    subject: "October statement available", preview: "Your monthly statement is ready to view in the client portal.", time: "Mon", date: "Earlier",
    category: "none", priority: "Low", unread: false, important: false, waiting: false, done: false,
    summary: "A routine automated notification that the October statement is available in the portal.",
    reason: "This is an automated notification and no direct response is requested.",
    nextStep: "No reply needed. Review only if required.",
    messages: [{ id: "m1", sender: "Finance at Alder", email: "accounts@alderpartners.com", time: "Monday, 7:30 AM", body: "Your October statement is now available in the Alder client portal. This is an automated notification; please do not reply to this email." }],
  },
  {
    id: "t8", sender: "Olivia Bennett", email: "olivia@larkandpine.com", initials: "OB",
    subject: "Re: Friday's introduction", preview: "That works perfectly. I'll send a calendar invitation shortly.", time: "Fri", date: "Earlier",
    category: "assistant", priority: "Normal", unread: false, important: false, waiting: false, done: true,
    summary: "The introduction has been arranged and Olivia will send a calendar invitation. The conversation is effectively resolved.",
    reason: "The arrangement is confirmed and there is no outstanding question.",
    nextStep: "No further response needed unless the invitation does not arrive.",
    messages: [{ id: "m1", sender: "Olivia Bennett", email: "olivia@larkandpine.com", time: "Friday, 3:15 PM", body: "That works perfectly. I'll send a calendar invitation shortly. Looking forward to it." }],
  },
  {
    id: "t9", sender: "Harbour House", email: "reservations@harbourhouse.co", initials: "HH",
    subject: "Reservation confirmed for 7:30 PM", preview: "Your table for four is confirmed for Thursday evening.", time: "Thu", date: "Earlier",
    category: "none", priority: "Low", unread: false, important: false, waiting: false, done: false,
    summary: "A reservation confirmation for four guests on Thursday at 7:30 PM.",
    reason: "The booking is confirmed and no response is required.",
    nextStep: "Add the reservation to the calendar.",
    messages: [{ id: "m1", sender: "Harbour House", email: "reservations@harbourhouse.co", time: "Thursday, 12:14 PM", body: "Your table for four is confirmed for Thursday at 7:30 PM. We look forward to welcoming you." }],
  },
];

const folders = [
  { id: "all", label: "All conversations", icon: Inbox },
  { id: "unread", label: "Unread", icon: Mail },
  { id: "assistant", label: "Assistant to reply", icon: Reply },
  { id: "client", label: "Client to reply", icon: UserRound },
  { id: "none", label: "No reply needed", icon: CheckCircle2 },
  { id: "waiting", label: "Waiting for response", icon: Clock3 },
  { id: "important", label: "Important", icon: Star },
  { id: "archived", label: "Archived", icon: Archive },
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}
function formatDate() {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}
function labelFor(category: Responsibility) {
  if (category === "assistant") return "Assistant to reply";
  if (category === "client") return "Client to reply";
  return "No reply needed";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [threads, setThreads] = useState<MailThread[]>(seedThreads);
  const [activeFolder, setActiveFolder] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("t1");
  const [clientPreview, setClientPreview] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      if (!firebaseUser) {
        router.replace("/login");
        return;
      }
      try {
        await reload(firebaseUser);
        if (!active) return;
        if (!firebaseUser.emailVerified) {
          router.replace("/verify-email");
          return;
        }
        setUser(firebaseUser);
      } catch {
        router.replace("/login");
      } finally {
        if (active) setAuthChecking(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("tandem-demo-threads");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setThreads(parsed as MailThread[]);
      }
    } catch {
      // Keep the bundled sample conversations if browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("tandem-demo-threads", JSON.stringify(threads));
    } catch {
      // Local persistence is optional in demonstration mode.
    }
  }, [threads]);

  const visibleThreads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return threads.filter((thread) => {
      if (clientPreview && (thread.category !== "client" || thread.archived || thread.done)) return false;
      if (!clientPreview) {
        if (activeFolder === "unread" && !thread.unread) return false;
        if (activeFolder === "assistant" && thread.category !== "assistant") return false;
        if (activeFolder === "client" && thread.category !== "client") return false;
        if (activeFolder === "none" && thread.category !== "none") return false;
        if (activeFolder === "waiting" && !thread.waiting) return false;
        if (activeFolder === "important" && !thread.important) return false;
        if (activeFolder === "archived" && !thread.archived) return false;
        if (activeFolder !== "archived" && thread.archived) return false;
      }
      if (normalized && !`${thread.sender} ${thread.subject} ${thread.preview}`.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [threads, activeFolder, query, clientPreview]);

  const selected = threads.find((thread) => thread.id === selectedId) ?? visibleThreads[0] ?? null;
  const assistantCount = threads.filter((thread) => thread.category === "assistant" && !thread.done).length;
  const clientCount = threads.filter((thread) => thread.category === "client" && !thread.done).length;
  const unreadCount = threads.filter((thread) => thread.unread && !thread.done).length;
  const waitingCount = threads.filter((thread) => thread.waiting && !thread.done).length;
  const displayName = user?.displayName?.trim() || user?.email?.split("@")[0] || "there";

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  function updateSelected(patch: Partial<MailThread>) {
    if (!selected) return;
    setThreads((current) => current.map((thread) => thread.id === selected.id ? { ...thread, ...patch } : thread));
  }
  function selectThread(id: string) {
    setSelectedId(id);
    setThreads((current) => current.map((thread) => thread.id === id ? { ...thread, unread: false } : thread));
  }
  function handleFolder(id: string) {
    setActiveFolder(id);
    setClientPreview(false);
    setMobileSidebar(false);
    const first = threads.find((thread) => {
      if (id === "all") return true;
      if (id === "unread") return thread.unread;
      if (id === "assistant") return thread.category === "assistant";
      if (id === "client") return thread.category === "client";
      if (id === "none") return thread.category === "none";
      if (id === "waiting") return thread.waiting;
      if (id === "archived") return thread.archived;
      return thread.important;
    });
    if (first) setSelectedId(first.id);
  }
  function changeResponsibility(value: Responsibility) {
    updateSelected({ category: value, waiting: false, done: false });
    notify(`Conversation moved to ${labelFor(value).toLowerCase()}.`);
  }
  function markHandled() {
    updateSelected({ done: true, category: "none", waiting: false, unread: false });
    notify("Marked as handled.");
  }
  function delegateToAssistant() {
    updateSelected({ category: "assistant", done: false, waiting: false });
    setClientPreview(false);
    setActiveFolder("all");
    notify("Sent back to the assistant workspace.");
  }
  function handleArchive() {
    updateSelected({ done: true, unread: false, archived: true });
    setActiveFolder("archived");
    notify("Conversation moved to Archived.");
  }
  function suggestReply() {
    if (!selected) return;
    setReplyText(`Hi ${selected.sender.split(" ")[0]},\n\nThank you for sending this through. I've noted the details and will come back to you shortly.\n\nBest,\n${displayName}`);
    setDraftSaved(false);
    notify("A suggested draft is ready for your review.");
  }
  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }
  function handleComposeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const recipient = String(form.get("to") || "").trim();
    const subject = String(form.get("subject") || "").trim();
    const body = String(form.get("body") || "").trim();
    const id = `draft-${Date.now()}`;
    const draftThread: MailThread = {
      id,
      sender: `Draft to ${recipient}`,
      email: recipient,
      initials: initials(recipient.split("@")[0].replace(/[._-]/g, " ")),
      subject,
      preview: body.slice(0, 110),
      time: "Just now",
      date: "Today",
      category: "assistant",
      priority: "Normal",
      unread: false,
      important: false,
      waiting: false,
      done: false,
      draft: true,
      summary: "This is an unsent draft created in the Tandem preview workspace.",
      reason: "A draft is waiting for review. Nothing has been sent.",
      nextStep: "Review the wording. Sending is disabled until a real email provider is connected.",
      messages: [{ id: "m1", sender: displayName, email: user?.email || "you@tandem.demo", time: "Just now", body, outgoing: true }],
    };
    setThreads((current) => [draftThread, ...current]);
    setSelectedId(id);
    setActiveFolder("all");
    setComposeOpen(false);
    notify("Draft saved locally. Nothing was sent.");
  }

  if (authChecking || !user) {
    return <main className="td-loading"><span className="td-mark">t.</span><p>Opening your workspace…</p></main>;
  }

  return (
    <main className="td-app-shell">
      <aside className={`td-sidebar ${mobileSidebar ? "is-open" : ""}`}>
        <div className="td-sidebar-top">
          <a href="/dashboard" className="td-wordmark"><span className="td-mark">t.</span><span>tandem</span></a>
          <button className="td-icon-button td-sidebar-close" onClick={() => setMobileSidebar(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="td-workspace-picker"><span className="td-workspace-symbol">N</span><span><strong>Northstar Studio</strong><small>Assistant workspace</small></span><ChevronDown size={15} /></div>
        <button className="td-compose-button" onClick={() => setComposeOpen(true)}><Plus size={16} /> Compose</button>
        <div className="td-sidebar-label">MAILBOX</div>
        <nav className="td-sidebar-nav">
          {folders.map((folder) => {
            const Icon = folder.icon;
            const count = folder.id === "assistant" ? assistantCount : folder.id === "client" ? clientCount : folder.id === "waiting" ? waitingCount : folder.id === "unread" ? unreadCount : folder.id === "all" ? threads.filter((thread) => !thread.archived).length : undefined;
            return <button key={folder.id} className={`td-sidebar-link ${activeFolder === folder.id && !clientPreview ? "active" : ""}`} onClick={() => handleFolder(folder.id)}>
              <Icon size={17} strokeWidth={1.75} /><span>{folder.label}</span>{count !== undefined && <small>{count}</small>}
            </button>;
          })}
        </nav>
        <div className="td-sidebar-label td-sidebar-label-spaced">WORKSPACE</div>
        <nav className="td-sidebar-nav">
          <button className={`td-sidebar-link ${clientPreview ? "active" : ""}`} onClick={() => { setClientPreview(true); setMobileSidebar(false); }}><Users size={17} /><span>Client view preview</span></button>
          <button className="td-sidebar-link" onClick={() => setAssistantOpen(true)}><Sparkles size={17} /><span>Ask Tandem</span><span className="td-nav-new">AI</span></button>
          <button className="td-sidebar-link" onClick={() => notify("Connected accounts are shown in demonstration mode.")}><ShieldCheck size={17} /><span>Connected accounts</span></button>
          <button className="td-sidebar-link" onClick={() => router.push("/dashboard/history")}><Activity size={17} /><span>Recent activity</span></button>
        </nav>
        <div className="td-sidebar-bottom">
          <div className="td-sidebar-help"><CircleHelp size={16} /><span>Need a hand?</span><ArrowRight size={14} /></div>
          <div className="td-user-card"><span className="td-user-avatar">{initials(displayName)}</span><span className="td-user-meta"><strong>{displayName}</strong><small>{user.email}</small></span><button className="td-icon-button" onClick={handleSignOut} aria-label="Sign out"><LogOut size={16} /></button></div>
        </div>
      </aside>

      {mobileSidebar && <button aria-label="Close navigation overlay" className="td-mobile-scrim" onClick={() => setMobileSidebar(false)} />}

      <section className="td-main">
        <header className="td-topbar">
          <div className="td-topbar-left">
            <button className="td-icon-button td-menu-trigger" onClick={() => setMobileSidebar(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <div className="td-breadcrumb"><span>Workspace</span><span>/</span><strong>{clientPreview ? "Client view" : "Inbox"}</strong></div>
          </div>
          <div className="td-topbar-actions">
            <span className="td-date-label">{formatDate()}</span>
            <button className="td-icon-button" onClick={() => notify("You're all caught up on notifications.")} aria-label="Notifications"><Bell size={17} /></button>
            <button className="td-avatar-button" onClick={handleSignOut} title="Sign out">{initials(displayName)}</button>
          </div>
        </header>

        <div className="td-content">
          {clientPreview ? (
            <>
              <div className="td-client-banner"><span><UserRound size={16} /> CLIENT PREVIEW</span><button onClick={() => { setClientPreview(false); setActiveFolder("all"); }}>Return to assistant view <ArrowRight size={14} /></button></div>
              <div className="td-page-heading"><div><p className="td-eyebrow">A QUIETER VIEW</p><h1>Good morning, Morgan.</h1><p className="td-heading-sub">A few things are waiting for your attention. Everything else is being taken care of.</p></div><span className="td-heading-date">Your personal inbox</span></div>
              <div className="td-client-summary"><div><span>Needs your decision</span><strong>{visibleThreads.filter((t) => !t.done).length.toString().padStart(2, "0")}</strong></div><div><span>Handled this week</span><strong>06</strong></div><div><span>Managed by your assistant</span><strong>12</strong></div></div>
              <div className="td-client-list">
                {visibleThreads.filter((t) => !t.done).map((thread) => <button key={thread.id} className="td-client-item" onClick={() => selectThread(thread.id)}>
                  <span className="td-thread-avatar">{thread.initials}</span><span className="td-client-item-copy"><span className="td-client-item-top"><strong>{thread.sender}</strong><time>{thread.time}</time></span><strong>{thread.subject}</strong><small>{thread.summary}</small><em>{thread.reason}</em></span><ArrowRight size={17} />
                </button>)}
                {visibleThreads.filter((t) => !t.done).length === 0 && <div className="td-empty-state"><CheckCircle2 size={26} /><strong>Nothing needs your attention.</strong><span>Your assistant is keeping everything moving.</span></div>}
              </div>
              {selected && selected.category === "client" && <section className="td-client-selected">
                <div><span className="td-eyebrow">CONVERSATION PREVIEW</span><h2>{selected.subject}</h2><p>{selected.sender} · {selected.time}</p></div>
                <p>{selected.summary}</p>
                <div className="td-client-actions"><button className="td-button td-button-dark" onClick={markHandled}><Check size={15} /> Mark handled</button><button className="td-button td-button-light" onClick={delegateToAssistant}>Ask assistant to take over <ArrowRight size={15} /></button></div>
              </section>}
            </>
          ) : (
            <>
              <div className="td-page-heading"><div><p className="td-eyebrow">YOUR DAILY BRIEF</p><h1>Your inbox, in rhythm.</h1><p className="td-heading-sub">A clearer view of what needs you, what can be handled, and what can wait.</p></div><button className="td-button td-button-light td-sync-button" onClick={() => notify("Sample inbox refreshed.")}><Activity size={15} /> Refresh view</button></div>
              <div className="td-stat-row">
                <div className="td-stat-card"><span>All conversations</span><strong>{threads.length.toString().padStart(2, "0")}</strong><small><Inbox size={13} /> {unreadCount} unread in sample inbox</small></div>
                <div className="td-stat-card"><span>Assistant to reply</span><strong>{assistantCount.toString().padStart(2, "0")}</strong><small><Reply size={13} /> Ready for you to handle</small></div>
                <div className="td-stat-card td-stat-attention"><span>Client to reply</span><strong>{clientCount.toString().padStart(2, "0")}</strong><small><UserRound size={13} /> Personal attention needed</small></div>
                <div className="td-stat-card"><span>Waiting for response</span><strong>{waitingCount.toString().padStart(2, "0")}</strong><small><Clock3 size={13} /> Follow up when appropriate</small></div>
              </div>

              <div className="td-workspace-grid">
                <section className="td-inbox-panel">
                  <div className="td-panel-heading">
                    <div><span className="td-eyebrow">CONVERSATIONS</span><h2>{activeFolder === "all" ? "All mail" : folders.find((f) => f.id === activeFolder)?.label}</h2></div>
                    <span className="td-count-label">{visibleThreads.length} conversations</span>
                  </div>
                  <div className="td-inbox-toolbar">
                    <label className="td-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations" /><kbd>⌘ K</kbd></label>
                    <button className="td-icon-button" onClick={() => setQuery("")} aria-label="Clear search"><MoreHorizontal size={18} /></button>
                  </div>
                  <div className="td-list-head"><span>FROM / SUBJECT</span><span>RESPONSIBILITY</span><span>RECEIVED</span></div>
                  <div className="td-thread-list">
                    {visibleThreads.map((thread) => <button key={thread.id} className={`td-thread-row ${selected?.id === thread.id ? "selected" : ""} ${thread.unread ? "unread" : ""}`} onClick={() => selectThread(thread.id)}>
                      <span className="td-thread-avatar">{thread.initials}</span>
                      <span className="td-thread-main"><span className="td-thread-sender">{thread.sender}{thread.important && <Star size={12} fill="currentColor" />}</span><strong>{thread.subject}</strong><small>{thread.preview}</small></span>
                      <span className={`td-responsibility ${thread.draft ? "draft" : thread.category}`}><i />{thread.draft ? "Draft" : labelFor(thread.category)}</span>
                      <time className="td-thread-time">{thread.time}</time>
                    </button>)}
                    {visibleThreads.length === 0 && <div className="td-empty-state"><Inbox size={24} /><strong>No conversations found</strong><span>Try another search or mailbox segment.</span></div>}
                  </div>
                  <div className="td-list-footer"><span>Showing sample conversations</span><button onClick={() => { setThreads(seedThreads); window.localStorage.removeItem("tandem-demo-threads"); notify("Sample inbox restored."); }}>Reset sample data</button></div>
                </section>

                <aside className="td-detail-panel">
                  {selected ? <>
                    <div className="td-detail-topline"><span className="td-eyebrow">MESSAGE OVERVIEW</span><div className="td-detail-tools"><button className={`td-icon-button ${selected.important ? "is-marked" : ""}`} onClick={() => updateSelected({ important: !selected.important })} aria-label={selected.important ? "Remove importance" : "Mark important"} title={selected.important ? "Remove importance" : "Mark important"}><Star size={16} fill={selected.important ? "currentColor" : "none"} /></button><button className="td-icon-button" onClick={() => updateSelected({ unread: !selected.unread })} aria-label="Toggle unread" title="Toggle unread"><Mail size={16} /></button><button className="td-icon-button" onClick={handleArchive} aria-label="Archive conversation" title="Archive conversation"><Archive size={16} /></button></div></div>
                    <h2 className="td-detail-subject">{selected.subject}</h2>
                    <div className="td-detail-sender"><span className="td-thread-avatar large">{selected.initials}</span><span><strong>{selected.sender}</strong><small>{selected.email}</small></span><time>{selected.time}</time></div>
                    <div className="td-message-history">
                      {selected.messages.map((message) => <article className={`td-message ${message.outgoing ? "outgoing" : ""}`} key={message.id}>
                        <div className="td-message-meta"><strong>{message.sender}</strong><time>{message.time}</time></div>
                        <p>{message.body}</p>
                        {message.id === "m1" && <span className="td-attachment"><Paperclip size={12} /> Conversation context</span>}
                      </article>)}
                    </div>
                    <div className="td-ai-insight">
                      <div className="td-ai-insight-head"><span><Sparkles size={14} /> TANDEM'S READ</span><span className="td-demo-pill">SAMPLE INSIGHT</span></div>
                      <p>{selected.summary}</p>
                      <div className="td-reason"><strong>Why this owner</strong><span>{selected.reason}</span></div>
                      <div className="td-next-step"><strong>Suggested next step</strong><span>{selected.nextStep}</span></div>
                    </div>
                    <div className="td-responsibility-control"><label htmlFor="responsibility">RESPONSIBILITY</label><select id="responsibility" value={selected.category} onChange={(e) => changeResponsibility(e.target.value as Responsibility)}><option value="assistant">Assistant to reply</option><option value="client">Client to reply</option><option value="none">No reply needed</option></select></div>
                    <div className="td-detail-actions"><button className="td-button td-button-dark" onClick={markHandled}><Check size={15} /> Mark handled</button><button className="td-button td-button-light" onClick={suggestReply}><Reply size={15} /> Draft reply</button></div>
                    {replyText && <div className="td-reply-editor"><div className="td-reply-editor-head"><strong>Reply draft</strong><button className="td-icon-button" onClick={() => setReplyText("")} aria-label="Close draft"><X size={15} /></button></div><textarea value={replyText} onChange={(e) => { setReplyText(e.target.value); setDraftSaved(false); }} /><div className="td-reply-editor-foot"><span>{draftSaved ? "Draft saved in this sample workspace" : "Review and edit before using"}</span><button onClick={() => { setDraftSaved(true); notify("Draft saved locally."); }}>Save draft <Check size={13} /></button></div></div>}
                  </> : <div className="td-empty-state"><Mail size={24} /><strong>Select a conversation</strong><span>Choose a message to review its context.</span></div>}
                </aside>
              </div>
              <div className="td-bottom-notes"><div><CalendarDays size={16} /><span><strong>Coming up</strong><small>11:30 AM · Project check-in with Maya</small></span></div><div><ShieldCheck size={16} /><span><strong>Connected account</strong><small>Demo mailbox · Not linked to a live email provider</small></span></div><button onClick={() => setAssistantOpen(true)}><Sparkles size={15} /> Ask Tandem</button></div>
            </>
          )}
        </div>
      </section>

      {assistantOpen && <div className="td-drawer-backdrop" onClick={() => setAssistantOpen(false)}><section className="td-ai-drawer" onClick={(e) => e.stopPropagation()}><div className="td-drawer-header"><span><Sparkles size={17} /> Ask Tandem</span><button className="td-icon-button" onClick={() => setAssistantOpen(false)}><X size={17} /></button></div><p className="td-drawer-intro">A sample assistant experience, grounded in the conversations shown in this workspace.</p><div className="td-ai-suggestions"><button onClick={() => { setActiveFolder("client"); setClientPreview(false); setAssistantOpen(false); }}>Show emails needing client attention <ArrowRight size={13} /></button><button onClick={() => { setActiveFolder("waiting"); setClientPreview(false); setAssistantOpen(false); }}>What are we waiting for? <ArrowRight size={13} /></button><button onClick={() => { setActiveFolder("assistant"); setClientPreview(false); setAssistantOpen(false); }}>Show my action list <ArrowRight size={13} /></button></div><div className="td-drawer-note"><Sparkles size={15} /><span>AI connections can be enabled when a model API is configured. This workspace currently uses sample insights.</span></div></section></div>}

      {composeOpen && <div className="td-modal-backdrop" onClick={() => setComposeOpen(false)}><section className="td-compose-modal" onClick={(e) => e.stopPropagation()}><div className="td-drawer-header"><span>New message</span><button className="td-icon-button" onClick={() => setComposeOpen(false)}><X size={17} /></button></div><form onSubmit={handleComposeSubmit}><label>To<input name="to" required type="email" placeholder="name@example.com" /></label><label>Subject<input name="subject" required placeholder="What is this about?" /></label><label>Message<textarea name="body" required placeholder="Write your message…" /></label><div className="td-compose-foot"><span>Demo mode · Nothing will be sent</span><button className="td-button td-button-dark" type="submit">Save draft <FileText size={14} /></button></div></form></section></div>}

      {toast && <div className="td-toast"><CheckCircle2 size={16} /> {toast}</div>}
    </main>
  );
}
