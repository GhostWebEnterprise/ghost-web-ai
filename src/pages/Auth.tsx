import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { GhostMark, Wordmark } from "@/components/ghost/GhostMark";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  UserX,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

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

const PITCH = [
  ["plan → kod", "plan → code"],
  ["Git branch", "git"],
  ["build → test", "ci"],
  ["fel → fix", "self-heal"],
  ["commit", "git"],
  ["GitHub Actions → verifiering", "github"],
  ["PR / release", "github"],
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

  const field =
    "border-2 border-foreground bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-0";

  return (
    <div className="nb-grid-paper flex min-h-screen flex-col bg-background text-foreground">
      {/* top bar */}
      <div className="border-b-2 border-foreground bg-background/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" aria-label="Ghost Web AI home">
            <Wordmark markSize="h-7 w-7" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 border-2 border-foreground bg-card px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider hover:bg-accent"
          >
            <ArrowLeft className="size-3.5" /> Back
          </Link>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center gap-10 px-4 py-10 lg:py-16">
        {/* pitch panel */}
        <div className="hidden flex-1 flex-col lg:flex">
          <p className="nb-overline inline-flex w-fit items-center gap-2 border-2 border-foreground bg-accent px-2 py-1">
            <GhostMark className="size-3.5" /> Free forever
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-[1.02] tracking-tight xl:text-5xl">
            The agent chain<br />
            waits for<br />
            <span className="border-4 border-foreground bg-[#4dd8e6] px-2">your repo.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-foreground/75">
            One prompt runs the whole delivery path. No credits, no paywall,
            no jumping between GitHub, terminal and CI. Sign in and point the
            chain at your first build.
          </p>
          <ul className="mt-7 flex max-w-md flex-col gap-2">
            {PITCH.map(([label, tag]) => (
              <li
                key={label}
                className="flex items-center justify-between border-2 border-foreground bg-card px-3 py-2"
              >
                <span className="font-mono text-[12px] font-bold">{label}</span>
                <span className="border border-foreground bg-muted px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* auth card */}
        <div className="mx-auto w-full max-w-[400px] lg:mx-0">
          <div className="nb-card nb-shadow-lg border-2 border-foreground bg-card">
            {/* card header */}
            <div className="flex items-center justify-between border-b-2 border-foreground bg-foreground px-4 py-3 text-background">
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.2em]">
                {step === "signIn" ? "Sign in / up" : "Verify code"}
              </span>
              <span className="border border-background/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider">
                Ghost console
              </span>
            </div>

            <div className="p-5">
              {step === "signIn" ? (
                <>
                  <div className="mb-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">
                      Get started
                    </h2>
                    <p className="mt-1 text-[12.5px] text-foreground/70">
                      Email login, or skip straight to the console as a guest.
                    </p>
                  </div>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        required
                        disabled={isLoading}
                        className={`${field} pl-9`}
                      />
                    </div>
                    {error && (
                      <p className="border-2 border-foreground bg-[#ff5c49]/30 px-2 py-1.5 text-[12px] font-semibold">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="mt-1 gap-2 border-2 border-foreground bg-accent py-2.5 text-xs font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#ffd166]"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          Email me a code <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="my-4 flex items-center gap-3">
                    <span className="h-0.5 flex-1 bg-foreground/15" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      or
                    </span>
                    <span className="h-0.5 flex-1 bg-foreground/15" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="w-full gap-2 border-2 border-foreground bg-background py-2.5 text-xs font-black uppercase tracking-wide text-foreground hover:bg-[#0f2417]"
                  >
                    <UserX className="size-4" />
                    Continue as guest
                  </Button>
                  <p className="mt-3 font-mono text-[9.5px] uppercase leading-4 tracking-wider text-muted-foreground">
                    No credits · no paywall — the agent chain runs free either
                    way.
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">
                      Check your email
                    </h2>
                    <p className="mt-1 text-[12.5px] leading-5 text-foreground/70">
                      We sent a code to <strong>{step.email}</strong>
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
                              className="border-2 border-foreground"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="border-2 border-foreground bg-[#ff5c49]/30 px-2 py-1.5 text-center text-[12px] font-semibold">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={isLoading || otp.length !== 6}
                      className="gap-2 border-2 border-foreground bg-accent py-2.5 text-xs font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#ffd166]"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          Verify &amp; enter <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </form>
                  <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                    <span className="text-muted-foreground">Wrong email?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("signIn");
                        setError(null);
                      }}
                      className="border border-foreground bg-background px-2 py-1 font-bold hover:bg-accent"
                    >
                      Use different email
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 border-t-2 border-foreground bg-muted px-4 py-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <GhostMark className="size-3 text-foreground" />
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
