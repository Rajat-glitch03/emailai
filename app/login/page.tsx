"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please fill in all the fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      window.location.href = "/dashboard";
    } catch (error: unknown) {
      console.error(error);

      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? error.code
          : "";

      switch (code) {
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;

        case "auth/user-not-found":
          setError("No account was found with this email.");
          break;

        case "auth/wrong-password":
          setError("Incorrect password.");
          break;

        case "auth/too-many-requests":
          setError(
            "Too many attempts. Please try again later."
          );
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        default:
          setError("Unable to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      setError("");

      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      window.location.href = "/dashboard";
    } catch (error: unknown) {
      console.error(error);

      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? error.code
          : "";

      if (code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (code === "auth/popup-blocked") {
        setError(
          "Your browser blocked the Google sign-in window."
        );
      } else {
        setError(
          "Unable to sign in with Google. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="td-auth-root">
      <section className="td-auth-story">
        <Link href="/" className="td-wordmark"><span className="td-mark">t.</span><span>tandem</span></Link>
        <div className="td-auth-story-copy">
          <span className="td-eyebrow">A BETTER WAY TO KEEP IN STEP</span>
          <h1>One inbox.<br /><em>Clear ownership.</em></h1>
          <p>Pick up where you left off. The right conversations, the right context, and a clearer next step — all in one place.</p>
          <div className="td-auth-story-note"><span><CheckCircle2 size={16} /></span><div><strong>Every conversation has an owner.</strong><small>Tandem helps your team know who needs to move things forward.</small></div></div>
        </div>
        <div className="td-auth-story-foot"><span>Thoughtful communication, shared clearly.</span><span>01 — Welcome back</span></div>
      </section>
      <section className="td-auth-form-side">
        <div className="td-auth-form-wrap">
          <Link href="/" className="td-auth-back"><ArrowLeft size={15} /> Back to Tandem</Link>
          <div className="td-auth-heading">
            <span className="td-eyebrow">WELCOME BACK</span>
            <h2>Good to see you again.</h2>
            <p>Sign in to return to your workspace.</p>
          </div>
          <form className="td-auth-form" onSubmit={handleEmailLogin}>
            <label>Email address<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@example.com" autoComplete="email" required /></label>
            <label><span className="td-label-row">Password <Link href="/forgot-password">Forgot password?</Link></span><span className="td-password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            {error && <div className="td-auth-error" role="alert">{error}</div>}
            <button className="td-button td-button-dark td-auth-submit" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"} <ArrowRight size={16} /></button>
          </form>
          <div className="td-auth-divider"><span>OR</span></div>
          <button className="td-google-button" onClick={handleGoogleLogin} disabled={loading}><span className="td-google-mark">G</span> Continue with Google</button>
          <p className="td-auth-switch">New to Tandem? <Link href="/signup">Create an account</Link></p>
          <p className="td-auth-legal">By continuing, you agree to use Tandem responsibly and keep your workspace information secure.</p>
        </div>
      </section>
    </main>
  );
}
