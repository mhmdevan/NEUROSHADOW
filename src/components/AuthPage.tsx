"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, Loader2, ShieldCheck } from "lucide-react";
import { secureFetch } from "@/lib/clientSecurity";
import { getDirection, getLocale, type Language } from "@/lib/i18n";

type AuthMode = "login" | "register";

const text = {
  en: {
    loginTitle: "Login to NEUROSHADOW",
    registerTitle: "Create your research account",
    subtitle: "A real multi-user workspace for private simulated sessions, reports, and feedback history.",
    name: "Full name",
    email: "Email",
    password: "Password",
    login: "Login",
    register: "Create account",
    loading: "Processing...",
    switchToRegister: "Need an account?",
    switchToLogin: "Already registered?",
    registerLink: "Register",
    loginLink: "Login",
    language: "فارسی",
    disclaimer:
      "NEUROSHADOW is an educational and research demonstration. It uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.",
    secure: "HttpOnly session cookie • password hashing • user-scoped data",
    panel: "User-scoped dashboard",
    errorFallback: "Authentication failed. Please try again.",
  },
  fa: {
    loginTitle: "ورود به NEUROSHADOW",
    registerTitle: "ساخت حساب پژوهشی",
    subtitle: "یک فضای کاری چندکاربره واقعی برای نشست‌ها، گزارش‌ها و بازخوردهای شبیه‌سازی‌شده هر کاربر.",
    name: "نام کامل",
    email: "ایمیل",
    password: "رمز عبور",
    login: "ورود",
    register: "ساخت حساب",
    loading: "در حال پردازش...",
    switchToRegister: "حساب ندارید؟",
    switchToLogin: "قبلاً ثبت‌نام کرده‌اید؟",
    registerLink: "ثبت‌نام",
    loginLink: "ورود",
    language: "English",
    disclaimer:
      "NEUROSHADOW یک نمونه آموزشی و پژوهشی است. این سامانه از داده‌های شبیه‌سازی‌شده استفاده می‌کند و تشخیص پزشکی، درمان یا توصیه سلامت ارائه نمی‌دهد.",
    secure: "کوکی HttpOnly • هش رمز عبور • داده جدا برای هر کاربر",
    panel: "داشبورد اختصاصی کاربر",
    errorFallback: "احراز هویت ناموفق بود. دوباره تلاش کنید.",
  },
} as const;

type AuthPageProps = {
  mode: AuthMode;
};

export function AuthPage({ mode }: AuthPageProps) {
  const [language, setLanguage] = useState<Language>("fa");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const copy = text[language];
  const direction = getDirection(language);
  const locale = getLocale(language);
  const isRegister = mode === "register";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  const title = isRegister ? copy.registerTitle : copy.loginTitle;
  const alternate = useMemo(
    () =>
      isRegister
        ? { label: copy.switchToLogin, href: "/login", action: copy.loginLink }
        : { label: copy.switchToRegister, href: "/register", action: copy.registerLink },
    [copy, isRegister],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await secureFetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, language }),
      });
      const payload = (await response.json()) as { ok?: boolean; errors?: Record<string, string> };
      if (!response.ok || !payload.ok) {
        setErrors(payload.errors ?? { form: copy.errorFallback });
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setErrors({ form: copy.errorFallback });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`auth-shell dir-${direction}`} dir={direction} lang={language}>
      <section className="auth-card">
        <div className="auth-card__visual">
          <div className="auth-card__mark">
            <BrainCircuit size={34} />
          </div>
          <p className="eyebrow">NEUROSHADOW</p>
          <h1>{title}</h1>
          <p>{copy.subtitle}</p>
          <div className="auth-card__secure">
            <ShieldCheck size={18} />
            {copy.secure}
          </div>
          <div className="auth-card__pulse" aria-hidden="true" />
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-form__top">
            <span>{copy.panel}</span>
            <button type="button" onClick={() => setLanguage(language === "en" ? "fa" : "en")}>
              {copy.language}
            </button>
          </div>

          {errors.form ? <div className="auth-error">{errors.form}</div> : null}

          {isRegister ? (
            <label>
              {copy.name}
              <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
              {errors.name ? <small>{errors.name}</small> : null}
            </label>
          ) : null}

          <label>
            {copy.email}
            <input
              autoComplete="email"
              dir="ltr"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email ? <small>{errors.email}</small> : null}
          </label>

          <label>
            {copy.password}
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              dir="ltr"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password ? <small>{errors.password}</small> : null}
          </label>

          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
            {loading ? copy.loading : isRegister ? copy.register : copy.login}
          </button>

          <p className="auth-alt">
            {alternate.label} <a href={alternate.href}>{alternate.action}</a>
          </p>
          <p className="auth-disclaimer">{copy.disclaimer}</p>
          <time>{new Date().toLocaleDateString(locale)}</time>
        </form>
      </section>
    </main>
  );
}
