"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/services/client";
import { isNative } from "@/lib/nativeBridge";
import {
  hasBiometricLogin,
  loginWithBiometrics,
  passkeySupported,
  passkeyLogin,
} from "@/services/auth";
import styles from "./page.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const [bio, setBio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
      return;
    }
    if (isNative()) {
      hasBiometricLogin().then(setBio).catch(() => setBio(false));
    } else {
      setBio(passkeySupported());
    }
  }, [router]);

  async function handleBio() {
    setLoading(true);
    setError("");
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap} data-theme="light">
      <div className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/myboardlogo.png" alt="MyBoard" className={styles.logo} />
        <h1 className={styles.title}>Bem-vindo ao MyBoard</h1>
        <p className={styles.subtitle}>
          Seus projetos, clientes, agenda e o Bordie — tudo num lugar só.
        </p>

        <div className={styles.actions}>
          {bio && (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleBio}
              disabled={loading}
            >
              {loading ? "Entrando…" : "Entrar com Touch ID"}
            </button>
          )}
          <button
            type="button"
            className={bio ? styles.btnSecondary : styles.btnPrimary}
            disabled={loading}
            onClick={() => router.push("/login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            disabled={loading}
            onClick={() => router.push("/login?mode=register")}
          >
            Criar conta
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>

      <p className={styles.footer}>MyBoard • organize. execute. entregue.</p>
    </div>
  );
}
