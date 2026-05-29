"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import { upsertMarkdownDetail } from "@/lib/projectDetailsHelpers";
import sectionStyles from "../ProjectDetailSection.module.css";

export default function MarkdownDetailSection({
  projectId,
  title,
  hint,
  category,
  detailKey,
  label,
  existingDetail,
  onSaved,
}) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    const value = existingDetail?.value ?? existingDetail?.value_text ?? "";
    setContent(typeof value === "string" ? value : "");
  }, [existingDetail]);

  async function handleSave() {
    setSaving(true);
    try {
      await upsertMarkdownDetail(
        projectId,
        { key: detailKey, category, label },
        content,
        existingDetail
      );
      setSavedAt(Date.now());
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>{title}</h2>
          {hint && <p className={sectionStyles.cardHint}>{hint}</p>}
        </div>
      </div>
      <textarea
        className={sectionStyles.textarea}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={hint}
      />
      <div className={sectionStyles.actions}>
        {savedAt && <span className={sectionStyles.saved}>Salvo</span>}
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </section>
  );
}
