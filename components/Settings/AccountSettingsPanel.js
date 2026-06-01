"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import { me } from "@/api/auth";
import { getStoredUser, getStoredTenant } from "@/api/client";
import { getUserAvatarUrl } from "@/lib/mediaUrl";
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
