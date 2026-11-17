"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import {
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleAccount, setGoogleAccount] = useState(false);

  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setGoogleAccount(false);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/check-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to check your account. Please try again."
        );
        return;
      }

      // No account
      if (!data.exists) {
        setError(
          "This email doesn't have a Tandem account. Please check your email or create an account."
        );
        return;
      }

      // Google account
      if (
        data.providers.includes("google.com") &&
        !data.providers.includes("password")
      ) {
        setGoogleAccount(true);

        setError(
          "This email uses Google Sign-In. Please continue with Google instead."
        );

        return;
      }

      // Email/password account
      if (data.providers.includes("password")) {
        await sendPasswordResetEmail(auth, cleanEmail);

        setSuccess(
          "We've sent a password reset link for this address. Check your inbox."
        );

        return;
      }

      // Other provider
      setError(
        "This account uses a different sign-in method. Please use the method you originally used to create your account."
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);
      setError("");

      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error(error);

      switch (error.code) {
        case "auth/popup-closed-by-user":
          setError("Google sign-in was cancelled.");
          break;

        case "auth/popup-blocked":
          setError(
            "Your browser blocked the Google sign-in window."
          );
          break;

        default:
          setError(
            "Unable to sign in with Google. Please try again."
          );
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f6f0] text-[#27312a]">
      {/* Soft ambient gradients matching the Tandem landing page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-44 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(223,116,252,0.18),rgba(105,245,255,0.10)_44%,transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-36 h-[430px] w-[430px] rounded-full bg-[radial-gradient(circle,rgba(252,116,198,0.13),transparent_70%)]"
      />

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.02fr_0.98fr]">
        {/* Branded editorial panel — desktop only. */}
        <section className="relative hidden min-h-screen overflow-hidden border-r border-[#e4e4da] bg-gradient-to-br from-[#edf0e8] via-white to-[#edf2eb] p-10 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-1.5 w-40 bg-gradient-to-r from-[#8ca184] via-[#a6b69b] to-[#d7a18b] xl:w-56"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-1.5 w-2/5 bg-gradient-to-r from-[#8ca184] via-[#a6b69b] to-[#d7a18b]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 top-[22%] h-80 w-80 rounded-full border border-[#a6b69b]/20 shadow-[0_0_0_32px_rgba(223,116,252,0.035),0_0_0_70px_rgba(105,245,255,0.035)]"
          />

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Tandem home">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#8ca184] via-[#a6b69b] to-[#d7a18b] text-[18px] font-black tracking-[-0.08em] text-[#27312a] shadow-[0_6px_18px_rgba(180,100,204,0.2)]">
                t.
              </span>
              <span className="text-[22px] font-extrabold tracking-[-0.065em] text-[#27312a]">
                tandem
              </span>
            </Link>
          </div>

          <div className="relative z-10 my-12 max-w-[590px] xl:my-16">
            <p className="mb-6 flex items-center gap-3 text-[14px] font-extrabold tracking-[0.17em] text-[#72796e]">
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-[#8ca184] to-[#a6b69b]" />
              Account recovery
            </p>

            <h2
              className="max-w-[560px] text-[clamp(3.25rem,5.1vw,5.35rem)] font-semibold leading-[1.03] tracking-[-0.055em] text-[#27312a]"
              style={{ fontFamily: "var(--q-font-display, var(--font-spectral, Georgia, serif))" }}
            >
              A clearer path back.
              <span className="mt-1 block bg-gradient-to-r from-[#45634c] via-[#a6b69b] to-[#87977e] bg-clip-text pb-1 text-transparent">
                Starts with one step.
              </span>
            </h2>

            <p className="mt-6 max-w-[430px] text-[14px] leading-7 text-[#72796e] xl:text-[15px] xl:leading-8">
              Recover access to your Tandem account and get back to managing your conversations with clarity.
            </p>

            {/* Illustrative recovery preview only; it is not live account data. */}
            <div className="mt-10 max-w-[520px] overflow-hidden rounded-[17px] border border-[#e6ddec] bg-white/95 shadow-[0_24px_65px_rgba(48,29,58,0.10)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#e4e4da] px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#8ca184] via-[#a6b69b] to-[#d7a18b] text-sm font-black text-[#27312a]">
                    <LockKeyhole size={15} />
                  </span>
                  <span>
                    <span className="block text-[11px] font-extrabold text-[#27312a]">Secure account recovery</span>
                    <span className="mt-0.5 block text-[9px] text-[#72796e]">A simple way to get back in</span>
                  </span>
                </div>
              </div>

              <div className="p-4 xl:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#72796e]">Your next step</p>
                    <p
                      className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.04em] text-[#27312a]"
                      style={{ fontFamily: "var(--q-font-display, var(--font-spectral, Georgia, serif))" }}
                    >
                      Back to what matters.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-[#e4e4da] px-2 py-1.5 text-[8px] text-[#72796e]">01 / 02</span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-[10px] border border-[#e4e4da] bg-gradient-to-r from-[#f5f0ff] to-[#effcff] p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#8ca184] via-[#a6b69b] to-[#d7a18b] text-[11px] font-black text-[#27312a]">1</span>
                    <span>
                      <span className="block text-[10px] font-extrabold text-[#27312a]">Check your email</span>
                      <span className="mt-0.5 block text-[9px] leading-4 text-[#72796e]">Open the reset link sent to your inbox.</span>
                    </span>
                    <CheckCircle2 size={16} className="ml-auto shrink-0 text-[#45634c]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-[10px] border border-[#e4e4da] p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#e4e4da] text-[11px] font-extrabold text-[#72796e]">2</span>
                    <span>
                      <span className="block text-[10px] font-extrabold text-[#27312a]">Choose a new password</span>
                      <span className="mt-0.5 block text-[9px] leading-4 text-[#72796e]">Then return to your Tandem workspace.</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 max-w-[500px] text-[9px] leading-5 text-[#81877c]">
              This panel is a visual guide. Your reset link and account status are handled by your existing recovery flow.
            </p>
          </div>

          <p className="relative z-10 text-[10px] font-medium tracking-[0.02em] text-[#72796e]">
            Better context. Clearer decisions.
          </p>
        </section>

        {/* Recovery form panel */}
        <section className="flex min-h-screen w-full flex-col justify-center px-5 py-7 sm:px-8 sm:py-10 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-[440px]">
            {/* Mobile brand header */}
            <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Tandem home">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#8ca184] via-[#a6b69b] to-[#d7a18b] text-sm font-black text-[#27312a]">t.</span>
                <span className="text-[19px] font-extrabold tracking-[-0.065em] text-[#27312a]">
                  tandem
                </span>
              </Link>
            </div>

            <Link
              href="/login"
              className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-[#72796e] transition-colors hover:text-[#45634c] lg:mb-10"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#45634c]">
                Account recovery
              </p>

              <h1
                className="mt-3 text-[clamp(2.25rem,4vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.05em] text-[#27312a]"
                style={{ fontFamily: "var(--q-font-display, var(--font-spectral, Georgia, serif))" }}
              >
                Reset your password
              </h1>

              <p className="mt-3 text-[13px] leading-6 text-[#72796e] sm:text-sm">
                Enter the email connected to your Tandem account. We’ll check your sign-in method and guide you through the next step.
              </p>
            </div>

            <form
              onSubmit={handleForgotPassword}
              className="mt-7 space-y-5 sm:mt-8"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[11px] font-bold text-[#27312a]"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81877c]"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setSuccess("");
                      setGoogleAccount(false);
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-12 w-full rounded-[10px] border border-[#e4e4da] bg-white pl-10 pr-4 text-sm text-[#27312a] outline-none transition placeholder:text-[#a29aa8] focus:border-[#87977e] focus:ring-4 focus:ring-[#a6b69b]/15"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-[10px] border border-[#f2c7d7] bg-[#fff4f8] px-4 py-3 text-xs leading-5 text-[#a02f54]"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="flex gap-3 rounded-[10px] border border-[#dfc5ed] bg-gradient-to-r from-[#effcff] via-[#fbf3ff] to-[#fff1f8] px-4 py-3 text-xs leading-5 text-[#4f594d]"
                >
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-[#45634c]"
                  />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#d6a7e4]/50 bg-gradient-to-r from-[#8ca184] via-[#a6b69b] to-[#d7a18b] px-5 text-sm font-extrabold text-[#27312a] shadow-[0_8px_22px_rgba(180,100,204,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_11px_27px_rgba(180,100,204,0.23)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45634c] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? "Checking account..." : "Send reset link"}

                {!loading && (
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </button>
            </form>

            {googleAccount && (
              <>
                <div className="my-6 flex items-center gap-4 sm:my-7">
                  <div className="h-px flex-1 bg-[#e4e4da]" />
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#81877c]">
                    or continue with
                  </span>
                  <div className="h-px flex-1 bg-[#e4e4da]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-[#e4e4da] bg-white text-sm font-bold text-[#302735] transition hover:border-[#d5a0e4] hover:bg-[#fdf9ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45634c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.35 12.27c0-.78-.07-1.53-.22-2.25H12v4.26h5.24a4.48 4.48 0 0 1-1.95 2.94v2.45h3.16c1.85-1.7 2.9-4.2 2.9-7.4Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 21.75c2.64 0 4.85-.87 6.46-2.36l-3.16-2.45c-.88.59-2  .94-3.3.94-2.54 0-4.69-1.72-5.46-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.75Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.85V7.62H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.38l3.26-2.53Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 6.12c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.84 3.22 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.72 5.37l3.26 2.53C7.31 7.84 9.46 6.12 12 6.12Z"
                    />
                  </svg>

                  {googleLoading
                    ? "Signing in..."
                    : "Continue with Google"}
                </button>
              </>
            )}

            <p className="mt-8 text-center text-xs text-[#72796e]">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-bold text-[#45634c] underline decoration-[#a6b69b]/60 decoration-2 underline-offset-4 transition-colors hover:text-[#612775]"
              >
                Log in
              </Link>
            </p>

            <p className="mt-5 text-center text-[10px] leading-5 text-[#81877c]">
              We’ll only use your email to help you recover your Tandem account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
