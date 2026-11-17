"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, CheckCircle2, Clock3, Mail, ShieldCheck, Star } from "lucide-react";
import { onAuthStateChanged, reload, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const events = [
  { icon: CheckCircle2, title: "A conversation was marked as handled", detail: "Friday's introduction · Olivia Bennett", time: "Today, 10:36 AM", tone: "green" },
  { icon: Mail, title: "A new conversation was added to the inbox", detail: "Updated travel itinerary · Jordan Lee", time: "Today, 9:18 AM", tone: "sage" },
  { icon: Star, title: "A conversation was marked important", detail: "Proposal for the spring campaign · Maya Chen", time: "Today, 8:57 AM", tone: "clay" },
  { icon: ShieldCheck, title: "Workspace sign-in verified", detail: "Your Tandem account", time: "Yesterday, 4:42 PM", tone: "sage" },
];

export default function ActivityPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

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
        if (active) setChecking(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (checking || !user) return <main className="td-loading"><span className="td-mark">t.</span><p>Opening your workspace…</p></main>;

  return (
    <main className="td-activity-page">
      <header><Link href="/dashboard" className="td-wordmark"><span className="td-mark">t.</span><span>tandem</span></Link><Link href="/dashboard" className="td-activity-back"><ArrowLeft size={14} /> Back to inbox</Link></header>
      <section>
        <span className="td-eyebrow">WORKSPACE HISTORY</span>
        <h1>A little more context.</h1>
        <p className="td-heading-sub">Recent activity from your Tandem sample workspace.</p>
        <div className="td-activity-list">
          {events.map((event) => {
            const Icon = event.icon;
            return <article key={event.title}><span className={`td-activity-icon ${event.tone}`}><Icon size={17} /></span><div><strong>{event.title}</strong><p>{event.detail}</p><small><Clock3 size={12} /> {event.time}</small></div></article>;
          })}
        </div>
        <p className="td-activity-note"><Activity size={14} /> Sample activity for the product preview. Connected workspace activity will appear here when the corresponding service is enabled.</p>
      </section>
    </main>
  );
}
