"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import { me, passkeySupported, registerPasskey, listPasskeys, deletePasskey } from "@/services/auth";
import { isNative } from "@/lib/nativeBridge";
import { getStoredUser, getStoredTenant } from "@/services/client";
import { getUserAvatarUrl } from "@/lib/mediaUrl";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import EditAccountModal from "./EditAccountModal";
import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./AccountSettingsPanel.module.css";

function ProfileField({ label, value }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value || "—"}</span>
    </div>
  );
}

export default function AccountSettingsPanel() {
  const [user, setUser] = useState(() => getStoredUser());
  const [tenant, setTenant] = useState(() => getStoredTenant());
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [pkSupported, setPkSupported] = useState(false);
  const [passkeys, setPasskeys] = useState([]);
  const [pkBusy, setPkBusy] = useState(false);

  const loadPasskeys = useCallback(async () => {
    try {
      const data = await listPasskeys();
      setPasskeys(Array.isArray(data) ? data : []);
    } catch {
      setPasskeys([]);
    }
  }, []);

  useEffect(() => {
    setPkSupported(passkeySupported());
    loadPasskeys();
  }, [loadPasskeys]);

  async function enablePasskey() {
    setPkBusy(true);
    try {
      const label = `Touch ID — ${typeof navigator !== "undefined" ? navigator.platform || "este dispositivo" : "este dispositivo"}`;
      await registerPasskey(label);
      showSuccessToast("Touch ID ativado! Use no próximo login.");
      await loadPasskeys();
    } catch (err) {
      if (err?.name !== "NotAllowedError") {
        showErrorToast(err.message || "Não foi possível ativar o Touch ID.");
      }
    } finally {
      setPkBusy(false);
    }
  }

  async function removePasskey(id) {
    if (!window.confirm("Remover esta passkey?")) return;
    try {
      await deletePasskey(id);
      showSuccessToast("Passkey removida.");
      await loadPasskeys();
    } catch (err) {
      showErrorToast(err.message || "Falha ao remover.");
    }
  }

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await me();
      if (data?.user) {
        setUser(data.user);
        setTenant(data.tenant || getStoredTenant());
      }
    } catch {
      setUser(getStoredUser());
      setTenant(getStoredTenant());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    function handleUserUpdated() {
      setUser(getStoredUser());
      setTenant(getStoredTenant());
    }

    window.addEventListener("myboard:user-updated", handleUserUpdated);
    return () => window.removeEventListener("myboard:user-updated", handleUserUpdated);
  }, []);

  const avatarUrl = getUserAvatarUrl(user);
  const initials = (user?.name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <SettingsPanelShell
        title="Sua conta"
        hint="Foto, nome e dados de acesso do seu perfil no MyBoard."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={loading || !user}
          >
            Editar perfil
          </Button>
        }
      >
        {loading ? (
          <p className={settingsPanelStyles.muted}>Carregando perfil...</p>
        ) : (
          <div className={styles.profileCard}>
            <div className={styles.avatarWrap}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </div>

            <div className={styles.fields}>
              <ProfileField label="Organização" value={tenant?.name} />
              <ProfileField label="Nome" value={user?.name} />
              <ProfileField label="E-mail" value={user?.email} />
            </div>
          </div>
        )}

        <article className={settingsPanelStyles.card} style={{ marginTop: 16 }}>
          <h3 className={settingsPanelStyles.cardTitle}>Login com Touch ID</h3>
          <p className={settingsPanelStyles.cardText}>
            Entre sem senha usando Touch ID / Face ID (passkey) — funciona no navegador e no app.
          </p>

          {isNative() ? (
            <p className={settingsPanelStyles.muted}>
              Neste app o Touch ID já funciona automaticamente: entre uma vez com a senha e, no
              próximo login, use o botão Touch ID.
            </p>
          ) : !pkSupported ? (
            <p className={settingsPanelStyles.muted}>
              Este navegador/dispositivo não suporta biometria (passkey).
            </p>
          ) : (
            <>
              {passkeys.length > 0 && (
                <ul className={styles.passkeyList}>
                  {passkeys.map((pk) => (
                    <li key={pk.id} className={styles.passkeyItem}>
                      <span className={styles.passkeyName}>🔒 {pk.name || "Touch ID"}</span>
                      <button
                        type="button"
                        className={styles.passkeyRemove}
                        onClick={() => removePasskey(pk.id)}
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: 12 }}>
                <Button variant="secondary" size="sm" onClick={enablePasskey} disabled={pkBusy}>
                  {pkBusy ? "Ativando…" : passkeys.length ? "Adicionar outro dispositivo" : "Ativar Touch ID"}
                </Button>
              </div>
            </>
          )}
        </article>
      </SettingsPanelShell>

      <EditAccountModal
        isOpen={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSaved={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    </>
  );
}
