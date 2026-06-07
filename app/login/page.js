"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthHero from "@/components/AuthHero/AuthHero";
import { LoginWelcomeBanner } from "@/components/AuthTransition/AuthTransition";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import Text from "@/components/Text/Text";
import { ApiError } from "@/api/client";
import {
  login,
  register,
  forgotPassword,
  passkeyLogin,
  passkeySupported,
  loginWithBiometrics,
  hasBiometricLogin,
} from "@/api/auth";
import { isNative } from "@/lib/nativeBridge";
import styles from "./page.module.css";

const MODES = {
  LOGIN: "login",
  REGISTER: "register",
  FORGOT: "forgot",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [showLogoutBanner, setShowLogoutBanner] = useState(false);
  const [mode, setMode] = useState(MODES.LOGIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantOptions, setTenantOptions] = useState([]);

  const [bioAvailable, setBioAvailable] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    setMounted(true);
    if (searchParams.get("logout") === "1") {
      setShowLogoutBanner(true);
    }
  }, [searchParams]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setTenantOptions([]);
  }

  useEffect(() => {
    // No app Mac (WKWebView) o passkey é bloqueado → usa Touch ID nativo.
    // No navegador → passkey (WebAuthn).
    if (isNative()) {
      hasBiometricLogin()
        .then(setBioAvailable)
        .catch(() => setBioAvailable(false));
    } else {
      setBioAvailable(passkeySupported());
    }
  }, []);

  async function handleBiometricLogin() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (isNative()) {
        await loginWithBiometrics();
      } else {
        await passkeyLogin();
      }
      router.push("/dashboard");
    } catch (err) {
      if (err?.name === "NotAllowedError" || /cancel/i.test(err?.message || "")) {
        setLoading(false);
        return;
      }
      setError(err.message || "Não foi possível entrar com Touch ID.");
      if (/expirada/i.test(err?.message || "")) setBioAvailable(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        email: loginForm.email.trim(),
        password: loginForm.password,
      };

      if (tenantSlug.trim()) {
        payload.tenant_slug = tenantSlug.trim();
      }

      await login(payload);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.code === "TENANT_SELECTION_REQUIRED") {
        setTenantOptions(err.details?.tenants || []);
        setError("Selecione a organização para continuar.");
      } else {
        setError(err.message || "Não foi possível entrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await register({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        company_name: registerForm.company_name.trim(),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await forgotPassword({ email: forgotEmail.trim() });
      setSuccess(result?.message || "Se o e-mail existir, enviaremos instruções.");
    } catch (err) {
      setError(err.message || "Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`${styles.page} ${mounted ? styles.pageMounted : ""}`}
      data-theme="light"
    >
      <div className={`${styles.heroWrap} ${mounted ? styles.heroMounted : ""}`}>
        <AuthHero />
      </div>

      <section className={`${styles.panel} ${mounted ? styles.panelMounted : ""}`}>
        <div className={styles.panelInner}>
          <LoginWelcomeBanner
            visible={showLogoutBanner}
            onDismiss={() => setShowLogoutBanner(false)}
          />

          {mode !== MODES.FORGOT && (
            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === MODES.LOGIN}
                className={`${styles.tab} ${mode === MODES.LOGIN ? styles.tabActive : ""}`}
                onClick={() => switchMode(MODES.LOGIN)}
              >
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === MODES.REGISTER}
                className={`${styles.tab} ${mode === MODES.REGISTER ? styles.tabActive : ""}`}
                onClick={() => switchMode(MODES.REGISTER)}
              >
                Criar conta
              </button>
            </div>
          )}

          {mode === MODES.LOGIN && (
            <>
              <header className={`${styles.header} ${styles.stagger1}`}>
                <Text variant="h2" as="h1">
                  Bem-vindo de volta
                </Text>
                <Text variant="body" muted>
                  Acesse sua conta para continuar
                </Text>
              </header>

              <form className={styles.form} onSubmit={handleLogin}>
                {bioAvailable && (
                  <div className={styles.stagger2}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      fullWidth
                      disabled={loading}
                      onClick={handleBiometricLogin}
                    >
                      🔒 Entrar com Touch ID
                    </Button>
                    <p className={styles.bioDivider}>ou entre com a senha</p>
                  </div>
                )}
                <div className={styles.stagger2}>
                  <Input
                    label="E-mail"
                    type="email"
                    placeholder="voce@empresa.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.stagger3}>
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {tenantOptions.length > 0 && (
                  <div className={styles.tenantSelect}>
                    <label className={styles.tenantLabel} htmlFor="tenant-slug">
                      Organização
                    </label>
                    <select
                      id="tenant-slug"
                      className={styles.select}
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {tenantOptions.map((tenant) => (
                        <option key={tenant.slug} value={tenant.slug}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={`${styles.forgotRow} ${styles.stagger3}`}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => switchMode(MODES.FORGOT)}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {error && <p className={styles.errorBanner}>{error}</p>}

                <div className={styles.stagger4}>
                  <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {mode === MODES.REGISTER && (
            <>
              <header className={`${styles.header} ${styles.stagger1}`}>
                <Text variant="h2" as="h1">
                  Crie sua conta
                </Text>
                <Text variant="body" muted>
                  Comece a organizar seus projetos em minutos
                </Text>
              </header>

              <form className={styles.form} onSubmit={handleRegister}>
                <Input
                  label="Nome completo"
                  placeholder="Seu nome"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  required
                  autoComplete="name"
                />
                <Input
                  label="Nome da empresa"
                  placeholder="Minha Empresa Ltda"
                  value={registerForm.company_name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, company_name: e.target.value })
                  }
                  required
                />
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                  autoComplete="email"
                />
                <Input
                  label="Senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  hint="Use pelo menos 6 caracteres"
                />

                {error && <p className={styles.errorBanner}>{error}</p>}

                <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </>
          )}

          {mode === MODES.FORGOT && (
            <>
              <header className={`${styles.header} ${styles.stagger1}`}>
                <Text variant="h2" as="h1">
                  Recuperar senha
                </Text>
                <Text variant="body" muted>
                  Enviaremos instruções para o seu e-mail
                </Text>
              </header>

              <form className={styles.form} onSubmit={handleForgot}>
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                {error && <p className={styles.errorBanner}>{error}</p>}
                {success && <p className={styles.successBanner}>{success}</p>}

                <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>

                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() => switchMode(MODES.LOGIN)}
                >
                  ← Voltar para entrar
                </button>
              </form>
            </>
          )}

          <Link href="/" className={styles.homeLink}>
            ← Voltar para o site
          </Link>
        </div>
      </section>
    </div>
  );
}
