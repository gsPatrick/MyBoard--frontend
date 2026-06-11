"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import { updateClient } from "@/services/clients";
import { showSuccessToast } from "@/lib/toast";
import sectionStyles from "../../ProjectDetail/ProjectDetailSection.module.css";

export default function ClientNotesSection({ client, onSaved }) {
  const [notes, setNotes] = useState(client.notes || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(client.notes || "");
  }, [client.notes]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateClient(client.id, {
        notes: notes.trim() || null,
      });
      onSaved?.(updated);
      showSuccessToast("Observações salvas");
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Observações</h2>
          <p className={sectionStyles.cardHint}>
            Anotações internas, preferências, histórico de relacionamento
          </p>
        </div>
      </div>

      <textarea
        className={sectionStyles.textarea}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Ex.: preferências de contato, contratos anteriores, pontos de atenção..."
        disabled={saving}
      />

      <div className={sectionStyles.actions}>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar observações"}
        </Button>
      </div>
    </section>
  );
}
