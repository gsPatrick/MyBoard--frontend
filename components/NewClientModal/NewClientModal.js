"use client";

import { useState } from "react";
import Modal, { ModalActions } from "@/components/Modal/Modal";
import Input from "@/components/Input/Input";
import AvatarDropzone from "@/components/AvatarDropzone/AvatarDropzone";
import { createClient, getClient } from "@/api/clients";
import { uploadMedia } from "@/api/media";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showSuccessToast } from "@/lib/toast";
import formStyles from "../shared/ModalForm.module.css";

export default function NewClientModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setCpf("");
    setCnpj("");
    setNotes("");
    setPhotoFile(null);
    setError("");
  }

  function handleClose() {
    if (loading) return;
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome é obrigatório");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tenantId = await ensureActiveTenant();
      if (!tenantId) {
        setError("Nenhuma organização ativa.");
        setLoading(false);
        return;
      }

      let client = await createClient({
        name: trimmedName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        cpf: cpf.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (photoFile && client?.id) {
        await uploadMedia({
          file: photoFile,
          entityType: "client",
          entityId: client.id,
          kind: "avatar",
        });
        client = await getClient(client.id);
      }

      resetForm();
      onCreated?.(client);
      onClose();
      showSuccessToast("Cliente criado com sucesso");
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch (err) {
      setError(err.message || "Não foi possível criar o cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo cliente"
      size="md"
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={handleSubmit}
          confirmLabel={loading ? "Salvando..." : "Criar cliente"}
        />
      }
    >
      <div className={formStyles.form}>
        <AvatarDropzone
          file={photoFile}
          onFileChange={setPhotoFile}
          disabled={loading}
          previewName={name}
        />

        <Input
          label="Nome"
          placeholder="Nome do cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoFocus
          required
        />
        <Input
          label="E-mail (opcional)"
          type="email"
          placeholder="contato@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <Input
          label="Telefone (opcional)"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
        <Input
          label="CPF (opcional)"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          disabled={loading}
        />
        <Input
          label="CNPJ (opcional)"
          placeholder="00.000.000/0000-00"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          disabled={loading}
        />
        <label className={formStyles.field}>
          <span className={formStyles.label}>Observações (opcional)</span>
          <textarea
            className={formStyles.textarea}
            rows={3}
            placeholder="Preferências, pontos de atenção, histórico..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </label>
        {error && <p className={formStyles.error}>{error}</p>}
      </div>
    </Modal>
  );
}
