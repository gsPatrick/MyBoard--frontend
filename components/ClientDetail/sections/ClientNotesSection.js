"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import { updateClient } from "@/api/clients";
import sectionStyles from "../../ProjectDetail/ProjectDetailSection.module.css";

export default function ClientNotesSection({ client, onSaved }) {
  const [notes, setNotes] = useState(client.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(client.notes || "");
  }, [client.notes]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateClient(client.id, {
        notes: notes.trim() || null,
      });
      onSaved?.(updated);
      setSaved(true);
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
        {saved && <span className={sectionStyles.saved}>Salvo</span>}
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar observações"}
        </Button>
      </div>
    </section>
  );
}
