"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  async function handleEmailSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all the fields.");
      return;
    }

    if (password.length < 6) {
      setError("Your password should be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name.trim(),
      });

      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: user.email,
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(user);
      setVerificationSent(true);
    } catch (error: any) {
      console.error(error);

      switch (error.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setError("Your password should be at least 6 characters.");
          break;

        default:
          setError("Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setLoading(true);
      setError("");

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: user.displayName || "User",
          email: user.email,
          createdAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error(error);

      switch (error.code) {
        case "auth/popup-closed-by-user":
          setError("Google sign-in was cancelled.");
          break;

        case "auth/popup-blocked":
          setError("Your browser blocked the Google sign-in window.");
          break;

        case "auth/account-exists-with-different-credential":
          setError(
            "An account already exists with this email using another sign-in method."
          );
          break;

        default:
          setError("Unable to sign up with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="td-auth-root td-auth-signup">
      <section className="td-auth-story">
        <Link href="/" className="td-wordmark"><span className="td-mark">t.</span><span>tandem</span></Link>
        <div className="td-auth-story-copy">
          <span className="td-eyebrow">MAKE ROOM FOR THE WORK THAT MATTERS</span>
          <h1>Stay close to<br /><em>what matters.</em></h1>
          <p>Bring your conversations into focus. Let routine requests move forward, and make the important decisions easier to see.</p>
          <div className="td-signup-mini">
            <div><span className="td-mini-dot sage" /><span><strong>Assistant to reply</strong><small>Handled with care</small></span><Check size={15} /></div>
            <div><span className="td-mini-dot rust" /><span><strong>Client to reply</strong><small>Personal attention needed</small></span><ArrowRight size={15} /></div>
            <div><span className="td-mini-dot grey" /><span><strong>No reply needed</strong><small>Nothing to carry forward</small></span><Check size={15} /></div>
          </div>
        </div>
        <div className="td-auth-story-foot"><span>Good communication is a shared responsibility.</span><span>02 — Get started</span></div>
      </section>
      <section className="td-auth-form-side">
        <div className="td-auth-form-wrap">
          <Link href="/" className="td-auth-back"><ArrowLeft size={15} /> Back to Tandem</Link>
          {verificationSent ? (
            <div className="td-verify-card">
              <span className="td-verify-icon"><Mail size={22} /></span>
              <span className="td-eyebrow">ONE LAST STEP</span>
              <h2>Check your inbox.</h2>
              <p>We sent a verification link to <strong>{email}</strong>. Open that message and confirm your address before signing in.</p>
              <Link href="/login" className="td-button td-button-dark td-auth-submit">Go to sign in <ArrowRight size={16} /></Link>
            </div>
          ) : (
            <>
              <div className="td-auth-heading">
                <span className="td-eyebrow">CREATE YOUR WORKSPACE</span>
                <h2>Let's get in step.</h2>
                <p>Create your account to start bringing your conversations together.</p>
              </div>
              <form className="td-auth-form" onSubmit={handleEmailSignup}>
                <label>Your name<input type="text" value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="Your name" autoComplete="name" required /></label>
                <label>Email address<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@example.com" autoComplete="email" required /></label>
                <label>Password<span className="td-password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="At least 6 characters" autoComplete="new-password" minLength={6} required /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
                {error && <div className="td-auth-error" role="alert">{error}</div>}
                <button className="td-button td-button-dark td-auth-submit" type="submit" disabled={loading}>{loading ? "Creating account…" : "Create account"} <ArrowRight size={16} /></button>
              </form>
              <div className="td-auth-divider"><span>OR</span></div>
              <button className="td-google-button" onClick={handleGoogleSignup} disabled={loading}><span className="td-google-mark">G</span> Continue with Google</button>
              <p className="td-auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
              <p className="td-auth-legal">By creating an account, you agree to keep your workspace information private and secure.</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
