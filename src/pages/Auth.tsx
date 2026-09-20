import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  UserX,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import "@/styles/ghost-ai-home.css";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

const PITCH: Array<[string, string]> = [
  ["plan → code", "plan"],
  ["git branch", "git"],
  ["build → test", "ci"],
  ["error → fix", "self-heal"],
  ["commit", "git"],
  ["actions → verify", "github"],
  ["PR / release", "ship"],
];

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      console.error("Guest login error:", err);
      setError(
        `Failed to sign in as guest: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="px-app flex min-h-screen flex-col">
      <header className="px-top">
        <Link to="/" className="px-brand" aria-label="Ghost Web AI home">
          <span className="px-brand-mark">GW</span>
          <span>
            GHOST<b>//</b>WEB<b>.AI</b>
          </span>
        </Link>
        <div className="px-top-actions" style={{ display: "flex" }}>
          <Link to="/" className="px-chip-btn">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center gap-12 px-4 py-10 lg:py-16">
        {/* pitch panel */}
        <div className="hidden flex-1 flex-col lg:flex">
          <div className="px-eyebrow">[ FREE FOREVER · RX0 ]</div>
          <h1 className="px-glitch mt-4" data-text="AGENT CHAIN" style={{ fontSize: "clamp(34px,5vw,58px)" }}>
            AGENT CHAIN
          </h1>
          <div className="px-sub" style={{ marginTop: 4 }}>WAITS FOR YOUR REPO</div>
          <p className="px-lead" style={{ maxWidth: 440, fontSize: 12 }}>
            One prompt runs the whole delivery path. No credits, no paywall, no
            jumping between GitHub, terminal and CI. Sign in and point the chain
            at your first build.
          </p>
          <ul className="mt-7 flex max-w-md flex-col gap-2">
            {PITCH.map(([label, tag]) => (
              <li
                key={label}
                className="px-frame flex items-center justify-between px-3 py-2"
              >
                <span className="font-mono text-[12px] font-bold uppercase tracking-wider">
                  {label}
                </span>
                <span className="px-badge">{tag}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* auth card */}
        <div className="mx-auto w-full max-w-[400px] lg:mx-0">
          <div className="px-frame">
            <div className="px-panel-head">
              <span className="t">
                {step === "signIn" ? "Sign in / up" : "Verify code"}
              </span>
              <span className="s">Ghost Console</span>
            </div>

            <div className="p-5">
              {step === "signIn" ? (
                <>
                  <div className="mb-5">
                    <h2 className="px-title-sm">Get started</h2>
                    <p className="px-lead" style={{ marginTop: 6 }}>
                      Email login, or skip straight to the console as a guest.
                    </p>
                  </div>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2.5">
                    <label className="px-label" htmlFor="email">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--px-faint)]" />
                      <input
                        id="email"
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        required
                        disabled={isLoading}
                        className="px-input"
                        style={{ paddingLeft: 34 }}
                      />
                    </div>
                    {error && (
                      <p className="px-frame px-2.5 py-2 text-[12px] font-semibold text-[var(--px-white)]">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-btn px-btn-primary mt-1"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          Email me a code <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-[var(--px-line)]" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--px-faint)]">
                      or
                    </span>
                    <span className="h-px flex-1 bg-[var(--px-line)]" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="px-btn w-full"
                  >
                    <UserX className="size-4" />
                    Continue as guest
                  </button>
                  <p className="mt-3 font-mono text-[9px] uppercase leading-4 tracking-wider text-[var(--px-faint)]">
                    No credits · no paywall — the agent chain runs free either
                    way.
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-5">
                    <h2 className="px-title-sm">Check your email</h2>
                    <p className="px-lead" style={{ marginTop: 6 }}>
                      We sent a code to{" "}
                      <strong className="text-[var(--px-white)]">{step.email}</strong>
                    </p>
                  </div>
                  <form onSubmit={handleOtpSubmit} className="flex flex-col gap-3">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            (e.target as HTMLElement).closest("form")?.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="border-[var(--px-line-strong)] bg-black text-[var(--px-white)]"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="px-frame px-2.5 py-2 text-center text-[12px] font-semibold text-[var(--px-white)]">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading || otp.length !== 6}
                      className="px-btn px-btn-primary"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          Verify &amp; enter <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  </form>
                  <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--px-dim)]">
                    <span>Wrong email?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("signIn");
                        setError(null);
                      }}
                      className="px-btn px-btn-ghost"
                      style={{ height: 28, padding: "0 10px" }}
                    >
                      Use different email
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-[var(--px-line)] px-4 py-3 font-mono text-[9px] uppercase tracking-widest text-[var(--px-faint)]">
              Secured by Ghost Securities ©
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
