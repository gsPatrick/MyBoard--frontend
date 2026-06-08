"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import SettingsPanelShell from "./SettingsPanelShell";
import { listSessions, revokeSession, revokeOtherSessions } from "@/api/auth";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import styles from "./SessionsSettingsPanel.module.css";

function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C61.4 141.2 0 184.4 0 272c0 25.9 4.7 52.7 14.2 80.3 12.6 36.4 58 125.7 105.4 124.2 24.8-.6 42.3-17.6 74.6-17.6 31.3 0 47.5 17.6 74.6 17.6 47.8-.7 88.9-81.8 100.9-118.3-64.1-30.2-60.9-88.5-60.9-90.2zM256.6 113c30.3-36 27.6-68.8 26.7-80.6-26.8 1.6-57.8 18.3-75.5 38.9-19.5 22.1-31 49.4-28.5 79.9 29 2.2 55.5-12.7 77.3-38.2z" />
    </svg>
  );
}
function WindowsIcon() {
  return (
    <svg viewBox="0 0 448 512" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
    </svg>
  );
}

function platformMeta(platform) {
  if (platform === "macos") return { icon: <AppleIcon />, label: "App Mac" };
  if (platform === "windows") return { icon: <WindowsIcon />, label: "App Windows" };
  return { icon: <GlobeIcon />, label: "Navegador" };
}

function relativeTime(value) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 2) return "ativo agora";
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SessionsSettingsPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [busyOthers, setBusyOthers] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRevoke(id) {
    setBusyId(id);
    try {
      await revokeSession(id);
      showSuccessToast("Dispositivo desconectado.");
      await load();
    } catch (err) {
      showErrorToast(err?.message || "Não foi possível desconectar.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeOthers() {
    setBusyOthers(true);
    try {
      await revokeOtherSessions();
      showSuccessToast("Outras sessões desconectadas.");
      await load();
    } catch (err) {
      showErrorToast(err?.message || "Não foi possível desconectar.");
    } finally {
      setBusyOthers(false);
    }
  }

  const others = sessions.filter((s) => !s.current);

  return (
    <SettingsPanelShell
      title="Sessões e dispositivos"
      hint="Veja onde sua conta está conectada (app Mac, Windows ou navegador) e desconecte o que não reconhecer."
      action={
        others.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={handleRevokeOthers} disabled={busyOthers}>
            {busyOthers ? "Desconectando…" : "Desconectar as outras"}
          </Button>
        ) : null
      }
    >
      {loading ? (
        <p className={styles.muted}>Carregando sessões…</p>
      ) : sessions.length === 0 ? (
        <p className={styles.muted}>Nenhuma sessão ativa encontrada.</p>
      ) : (
        <ul className={styles.list}>
          {sessions.map((s) => {
            const meta = platformMeta(s.platform);
            return (
              <li
                key={s.id}
                className={`${styles.item} ${s.current ? styles.itemCurrent : ""}`}
              >
                <div className={styles.icon} data-platform={s.platform}>
                  {meta.icon}
                </div>
                <div className={styles.info}>
                  <div className={styles.titleRow}>
                    <span className={styles.name}>{s.client_name || meta.label}</span>
                    {s.current && <span className={styles.badge}>Este dispositivo</span>}
                  </div>
                  <div className={styles.metaRow}>
                    <span>{meta.label}</span>
                    {s.os && <span>· {s.os}</span>}
                    {s.ip_address && <span>· {s.ip_address}</span>}
                  </div>
                  <div className={styles.metaRowSub}>
                    <span>{relativeTime(s.last_seen_at)}</span>
                    <span>· conectado em {formatDate(s.created_at)}</span>
                  </div>
                </div>
                <div className={styles.action}>
                  {s.current ? (
                    <span className={styles.currentTag}>Sessão atual</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.revokeBtn}
                      onClick={() => handleRevoke(s.id)}
                      disabled={busyId === s.id}
                    >
                      {busyId === s.id ? "…" : "Desconectar"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SettingsPanelShell>
  );
}
