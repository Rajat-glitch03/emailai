"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import {
  onAuthStateChanged,
  reload,
  sendEmailVerification,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? "");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleCheckVerification() {
    const user = auth.currentUser;

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setChecking(true);
      setError("");
      setMessage("");

      await reload(user);

      if (user.emailVerified) {
        setMessage("Your email is verified. Taking you to your dashboard...");

        if (user.emailVerified) {
          router.push("/dashboard");
          return;
        }
      }

      setError(
        "Your email is not verified yet. Please open the verification email and click the link."
      );
    } catch (error) {
      console.error(error);
      setError("We couldn't check your verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleResendVerification() {
    const user = auth.currentUser;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      setResending(true);
      setError("");
      setMessage("");

      await sendEmailVerification(user);

      setMessage("A new verification email has been sent.");
    } catch (error: any) {
      console.error(error);

      if (error.code === "auth/too-many-requests") {
        setError(
          "Too many verification emails were requested. Please wait a little and try again."
        );
      } else {
        setError("Unable to send the verification email. Please try again.");
      }
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f6f0] text-[#27312a]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(223,116,252,0.18),rgba(105,245,255,0.10)_44%,transparent_72%)]"
        />
        <div className="relative text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#8ca184] via-[#a6b69b] to-[#d7a18b] text-lg font-black text-[#27312a] shadow-[0_8px_24px_rgba(180,100,204,0.2)] animate-pulse">
            t.
          </div>
          <p className="mt-4 text-xs text-[#72796e]">Checking your account...</p>
        </div>
      </main>
    );
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
              One last step
            </p>

            <h2
              className="max-w-[560px] text-[clamp(3.25rem,5.1vw,5.35rem)] font-semibold leading-[1.04] tracking-[-0.055em] text-[#27312a]"
              style={{ fontFamily: "var(--q-font-display, var(--font-spectral, Georgia, serif))" }}
            >
              Make sure it’s
              <span className="mt-1 block bg-gradient-to-r from-[#45634c] via-[#a6b69b] to-[#87977e] bg-clip-text text-transparent">
                really you.
              </span>
            </h2>

            <p className="mt-6 max-w-[430px] text-[14px] leading-7 text-[#72796e] xl:text-[15px] xl:leading-8">
              Confirm your email address to finish setting up your Tandem account and keep your workspace connected to you.
            </p>

            {/* Illustrative verification preview; no extra functionality. */}
            <div className="mt-10 max-w-[520px] overflow-hidden rounded-[17px] border border-[#e6ddec] bg-white/95 shadow-[0_24px_65px_rgba(48,29,58,0.10)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#e4e4da] px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#8ca184] via-[#a6b69b] to-[#d7a18b] text-[#27312a]">
                    <Mail size={15} />
                  </span>
                  <span>
                    <span className="block text-[11px] font-extrabold text-[#27312a]">Email verification</span>
                    <span className="mt-0.5 block text-[9px] text-[#72796e]">A quick security check</span>
                  </span>
                </div>
              </div>

              <div className="p-4 xl:p-5">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#72796e]">
                  Check your inbox
                </p>
                <p
                  className="mt-2 text-[23px] leading-tight tracking-[-0.04em] text-[#27312a]"
                  style={{ fontFamily: "var(--q-font-display, var(--font-spectral, Georgia, serif))" }}
                >
                  Your workspace is almost ready.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 text-[10px] text-[#4f594d]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#edf2eb] via-[#f8eaff] to-[#fff0f8] text-[#8e3dac]">
                      <Mail size={12} />
                    </span>
                    Open the verification email
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#4f594d]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#edf2eb] via-[#f8eaff] to-[#fff0f8] text-[#8e3dac]">
                      <CheckCircle2 size={12} />
                    </span>
                    Select the verification link
                  </div>
                </div>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#f0e9f4]">
                  <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#8ca184] via-[#a6b69b] to-[#d7a18b]" />
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-[10px] font-medium tracking-[0.02em] text-[#72796e]">
            A little confirmation. A clearer way forward.
          </p>
        </section>

        {/* Verification panel */}
        <section className="flex min-h-screen w-full flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-[500px]">
            {/* Mobile brand header */}
            <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Tandem home">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#8ca184] via-[#a6b69b] to-[#d7a18b] text-sm font-black text-[#27312a]">
                  t.
                </span>
                <span className="text-[19px] font-extrabold tracking-[-0.065em] text-[#27312a]">
                  tandem
                </span>
              </Link>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#72796e]">
                Verification
              </span>
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
                Almost there
              </p>

              <h1
                className="mt-3 text-[clamp(2.45rem,4.2vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.055em] text-[#27312a]"
                style={{ fontFamily: "var(--q-font-display, var(--font-spectral, Georgia, serif))" }}
              >
                Verify your email
              </h1>

              <p className="mt-4 text-[13px] leading-7 text-[#72796e] sm:text-sm">
                We sent a verification link to your inbox. Confirm the address below to finish setting up your Tandem account.
              </p>
            </div>

            <div className="mt-7 overflow-hidden rounded-[16px] border border-[#e6ddec] bg-white shadow-[0_18px_48px_rgba(48,29,58,0.07)] sm:mt-8">
              <div className="flex items-center gap-3 border-b border-[#e4e4da] bg-gradient-to-r from-[#f9f5fc] via-white to-[#f0fdff] p-4 sm:p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#8ca184] via-[#a6b69b] to-[#d7a18b] text-[#27312a] shadow-[0_6px_18px_rgba(180,100,204,0.16)]">
                  <Mail size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#45634c]">Verification email sent to</p>
                  <p className="mt-1 break-all text-[13px] font-bold text-[#27312a]">{email}</p>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-[12px] leading-6 text-[#72796e]">
                  Open the email and click the verification link. Then return here and check your status.
                </p>

                {error && (
                  <div
                    role="alert"
                    className="mt-5 rounded-[10px] border border-[#f0c6c6] bg-[#fff5f5] px-4 py-3 text-xs leading-5 text-[#a03535]"
                  >
                    {error}
                  </div>
                )}

                {message && (
                  <div
                    role="status"
                    className="mt-5 flex gap-3 rounded-[10px] border border-[#cce8dc] bg-[#f1fbf6] px-4 py-3 text-xs leading-5 text-[#28664d]"
                  >
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={checking || resending}
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#d6a7e7]/50 bg-gradient-to-r from-[#8ca184] via-[#a6b69b] to-[#d7a18b] px-5 text-sm font-extrabold text-[#27312a] shadow-[0_7px_20px_rgba(180,100,204,0.16)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(180,100,204,0.23)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checking ? "Checking..." : "I've verified my email"}
                    {!checking && (
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={checking || resending}
                    className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[#e6ddec] bg-white px-5 text-sm font-bold text-[#4f594d] transition duration-200 hover:border-[#a6b69b] hover:bg-gradient-to-r hover:from-[#f5fdff] hover:via-[#fbf4ff] hover:to-[#fff4fa] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resending ? "Sending..." : "Resend verification email"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-[12px] border border-[#e4e4da] bg-white/75 p-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#edf2eb] via-[#f8eaff] to-[#fff0f8] text-[#45634c]">
                <Mail size={14} />
              </span>
              <p className="text-[11px] leading-5 text-[#72796e]">
                Didn’t receive the email? Check your spam or promotions folder. You can also resend the verification email above.
              </p>
            </div>

            <p className="mt-6 text-center text-[11px] text-[#72796e]">
              Need to use another account?{" "}
              <Link
                href="/login"
                className="font-bold text-[#45634c] underline decoration-[#a6b69b] decoration-2 underline-offset-4 transition-colors hover:text-[#652780]"
              >
                Back to login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
