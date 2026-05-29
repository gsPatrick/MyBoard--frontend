"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import AvatarDropzone from "@/components/AvatarDropzone/AvatarDropzone";
import { getClient, updateClient } from "@/api/clients";
import { uploadMedia } from "@/api/media";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import sectionStyles from "../../ProjectDetail/ProjectDetailSection.module.css";

export default function ClientContactSection({ client, onSaved }) {
  const [name, setName] = useState(client.name || "");
  const [email, setEmail] = useState(client.email || "");
  const [phone, setPhone] = useState(client.phone || "");
  const [company, setCompany] = useState(client.company || "");
  const [document, setDocument] = useState(client.document || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setName(client.name || "");
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setCompany(client.company || "");
    setDocument(client.document || "");
    setPhotoFile(null);
  }, [client]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome é obrigatório");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let updated = await updateClient(client.id, {
        name: trimmedName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        document: document.trim() || null,
      });

      if (photoFile) {
        await uploadMedia({
          file: photoFile,
          entityType: "client",
          entityId: client.id,
          kind: "avatar",
        });
        updated = await getClient(client.id);
      }

      onSaved?.(updated);

      setPhotoFile(null);
      setSuccess("Dados salvos com sucesso");
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch (err) {
      setError(err.message || "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl = getClientAvatarUrl(client);

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Dados de contato</h2>
          <p className={sectionStyles.cardHint}>
            Nome, empresa, e-mail, telefone e documento do cliente
          </p>
        </div>
      </div>

      <div className={sectionStyles.formGrid}>
        <div className={sectionStyles.formFull}>
          <AvatarDropzone
            label="Foto do cliente"
            file={photoFile}
            onFileChange={setPhotoFile}
            disabled={saving}
            previewName={name}
            existingPreviewUrl={photoFile ? null : avatarUrl}
          />
        </div>
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
        <Input
          label="Empresa"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={saving}
        />
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={saving}
        />
        <Input
          label="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={saving}
        />
        <Input
          label="CPF/CNPJ"
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          disabled={saving}
        />
      </div>

      {error && <p className={sectionStyles.empty} style={{ color: "var(--color-danger, #e5484d)" }}>{error}</p>}
      {success && <p className={sectionStyles.saved}>{success}</p>}

      <div className={sectionStyles.actions}>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar contato"}
        </Button>
      </div>
    </section>
  );
}
