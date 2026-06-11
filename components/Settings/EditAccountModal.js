"use client";

import { useEffect, useState } from "react";
import Modal, { ModalActions } from "@/components/Modal/Modal";
import Input from "@/components/Input/Input";
import AvatarDropzone from "@/components/AvatarDropzone/AvatarDropzone";
import { me, updateProfile } from "@/services/auth";
import { uploadMedia } from "@/services/media";
import { getToken, saveSession } from "@/services/client";
import { getUserAvatarUrl } from "@/lib/mediaUrl";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import formStyles from "../shared/ModalForm.module.css";

export default function EditAccountModal({ isOpen, user, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !user) return;
    setName(user.name || "");
    setEmail(user.email || "");
    setPhotoFile(null);
    setError("");
  }, [isOpen, user]);

  function handleClose() {
    if (loading) return;
    onClose();
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Nome é obrigatório");
      return;
    }

    if (!trimmedEmail) {
      setError("E-mail é obrigatório");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateProfile({
        name: trimmedName,
        email: trimmedEmail,
      });

      if (photoFile && user?.id) {
        await uploadMedia({
          file: photoFile,
          entityType: "user",
          entityId: user.id,
          kind: "avatar",
        });
      }

      const fresh = await me();
      if (fresh?.user) {
        saveSession({
          token: getToken(),
          user: fresh.user,
          tenant: fresh.tenant,
        });
        window.dispatchEvent(new CustomEvent("myboard:user-updated"));
        onSaved?.(fresh.user);
      }

      showSuccessToast("Perfil atualizado");
      onClose();
    } catch (err) {
      const message = err.message || "Não foi possível salvar o perfil";
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar perfil"
      size="md"
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={handleSubmit}
          confirmLabel={loading ? "Salvando..." : "Salvar alterações"}
        />
      }
    >
      <div className={formStyles.form}>
        <AvatarDropzone
          label="Foto de perfil"
          file={photoFile}
          onFileChange={setPhotoFile}
          disabled={loading}
          previewName={name || user.name}
          existingPreviewUrl={photoFile ? null : getUserAvatarUrl(user)}
        />

        <Input
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={loading}
          autoComplete="name"
        />

        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          autoComplete="email"
        />

        {error && <p className={formStyles.error}>{error}</p>}
      </div>
    </Modal>
  );
}
