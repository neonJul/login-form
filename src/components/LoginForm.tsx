import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SuccessCard } from "./SuccessCard";
import { Spinner } from "./Spinner";
import clsx from "clsx";
import {
  DEMO_DB,
  emailPatternValid,
  type LoginResponse,
  sleep,
} from "../utils";

// - Mocked fetch() with realistic delays & errors
// - UX & A11y focused: labels, hints, aria-* states, live regions, focus management
// - caps-lock, show/hide
// - Lockout/cooldown after repeated failures
// - Keyboard shortcuts, reduced motion, dark mode aware
// - Persist email when "Remember me" is checked

let attemptCounter = 0;
let lockedUntil = 0;

async function mockLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  await sleep(700 + Math.random() * 500);

  const now = Date.now();
  if (now < lockedUntil) {
    const remain = Math.ceil((lockedUntil - now) / 1000);
    return {
      ok: false,
      code: "LOCKED",
      message: `Too many attempts. Try again in ${remain}s.`,
    };
  }

  const record = DEMO_DB[email.toLowerCase()];
  const correct = record && record.password === password;

  if (!correct) {
    attemptCounter += 1;
    if (attemptCounter >= 5) {
      lockedUntil = Date.now() + 30_000;
      attemptCounter = 0;
      return {
        ok: false,
        code: "LOCKED",
        message:
          "Account temporarily locked due to repeated failures. Please wait 30 seconds.",
      };
    }
    return {
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
    };
  }

  attemptCounter = 0;

  return { ok: true, token: Math.random().toString(36).slice(2) };
}

type Step = "form" | "done";

type FormErrors = {
  email?: string;
  password?: string;
  summary?: string[];
};

export function LoginForm() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState<string>(
    () => localStorage.getItem("rememberedEmail") || "",
  );
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(
    Boolean(localStorage.getItem("rememberedEmail")),
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [capsLock, setCapsLock] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockCountdown, setLockCountdown] = useState<number | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const passwordHintId = useId();
  const strengthId = useId();
  const summaryId = useId();
  const otpId = useId();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const validate = useCallback((): FormErrors => {
    const next: FormErrors = { summary: [] };

    if (!email) next.summary!.push("Email is required.");
    if (email && !emailPatternValid(email)) {
      next.email = "Enter a valid email address.";
      next.summary!.push("Email format looks off.");
    }
    if (!password) next.summary!.push("Password is required.");

    if (next.summary!.length === 0) delete next.summary;
    return next;
  }, [email, password]);

  const handleSubmit = useCallback(async () => {
    const v = validate();
    setErrors(v);
    if (v.summary) {
      // focus first invalid field
      if (v.email) emailRef.current?.focus();
      else if (v.password) passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    setErrors({});

    const res = await mockLogin(email.trim(), password);
    setLoading(false);

    if (!res.ok) {
      // If locked, start countdown UI
      if (res.code === "LOCKED") {
        setLockCountdown(Math.ceil((lockedUntil - Date.now()) / 1000));
      }
      setErrors({ summary: [res.message] });
      emailRef.current?.focus();
      return;
    }

    setStep("done");
  }, [email, password, validate]);

  useEffect(() => {
    // Focus first field on step change
    if (step === "form") emailRef.current?.focus();
  }, [step, otpId]);

  useEffect(() => {
    let timer: number | undefined;
    if (lockCountdown !== null) {
      timer = window.setInterval(() => {
        const remain = Math.max(
          0,
          Math.ceil((lockedUntil - Date.now()) / 1000),
        );
        if (remain <= 0) {
          setLockCountdown(null);
          window.clearInterval(timer);
        } else {
          setLockCountdown(remain);
        }
      }, 500);
    }
    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [lockCountdown]);

  useEffect(() => {
    if (remember && emailPatternValid(email)) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }
  }, [remember, email]);

  const emailValid = emailPatternValid(email);
  const formValid = emailValid && password.length > 0;

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Sign in to your account
          </p>
        </div>

        <section
          aria-busy={loading || undefined}
          aria-describedby={errors.summary ? summaryId : undefined}
          className={clsx(
            "rounded-2xl shadow-xl bg-white/80 dark:bg-slate-900/70 backdrop-blur border border-slate-200/70 dark:border-slate-800",
            "p-6",
          )}
        >
          {errors.summary && (
            <div
              id={summaryId}
              role="alert"
              className="mb-4 rounded-xl border border-red-300/70 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
            >
              <p className="font-medium mb-1">We couldn't sign you in</p>
              <ul className="list-disc pl-5 space-y-1">
                {errors.summary.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {lockCountdown !== null && (
            <div
              className="mb-4 rounded-xl border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              role="status"
              aria-live="polite"
            >
              Too many failed attempts. Please wait {lockCountdown}s before
              trying again.
            </div>
          )}

          {step === "form" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              noValidate
            >
              <div className="grid gap-4">
                <div>
                  <label
                    htmlFor={emailId}
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Email address
                  </label>
                  <input
                    ref={emailRef}
                    id={emailId}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-invalid={Boolean(errors.email) || undefined}
                    aria-describedby={
                      errors.email ? emailId + "-error" : undefined
                    }
                    className={clsx(
                      "mt-1 w-full rounded-xl border px-3 py-2 text-base",
                      "bg-white dark:bg-slate-950/60 text-slate-900 dark:text-slate-100",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                      errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-300 dark:border-slate-700 focus:ring-slate-500",
                    )}
                    placeholder="you@company.com"
                  />
                  {errors.email && (
                    <p
                      id={emailId + "-error"}
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={passwordId}
                      className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-pressed={showPassword}
                      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white underline-offset-2 hover:underline"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    ref={passwordRef}
                    id={passwordId}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) =>
                      setCapsLock(
                        e.getModifierState && e.getModifierState("CapsLock"),
                      )
                    }
                    onKeyDown={(e) =>
                      setCapsLock(
                        e.getModifierState && e.getModifierState("CapsLock"),
                      )
                    }
                    required
                    aria-invalid={Boolean(errors.password) || undefined}
                    aria-describedby={clsx(
                      passwordHintId,
                      strengthId,
                      errors.password ? passwordId + "-error" : undefined,
                    )}
                    className={clsx(
                      "mt-1 w-full rounded-xl border px-3 py-2 text-base",
                      "bg-white dark:bg-slate-950/60 text-slate-900 dark:text-slate-100",
                      errors.password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-300 dark:border-slate-700 focus:ring-slate-500",
                    )}
                    placeholder="••••••••"
                  />

                  {capsLock && (
                    <div
                      className="mt-2 text-xs text-amber-700 dark:text-amber-300"
                      role="status"
                      aria-live="polite"
                    >
                      Warning: Caps Lock is on.
                    </div>
                  )}
                  {errors.password && (
                    <p
                      id={passwordId + "-error"}
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>

                <button
                  ref={submitRef}
                  type="submit"
                  disabled={!formValid || loading || lockCountdown !== null}
                  className={clsx(
                    "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium",
                    "bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {loading ? (
                    <Spinner label="Signing in…" />
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === "done" && <SuccessCard email={email} />}
        </section>

        <footer className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>
            Demo account: <br />
            <code>mock@email.com</code> <br />
            <code>Password123</code>
          </p>
        </footer>
      </main>
    </div>
  );
}
