"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { findDetailByKey, MARKETPLACE_DETAIL_SPECS } from "@/lib/projectDetailConfig";
import { upsertProjectDetail } from "@/lib/projectDetailsHelpers";
import { getMarketplaceTabLabel } from "@/lib/projectOrigin";
import { showSuccessToast } from "@/lib/toast";
import sectionStyles from "../ProjectDetailSection.module.css";
import styles from "./MarketplaceSection.module.css";

function readDetailValue(detail) {
  if (!detail) return "";
  const value = detail.value ?? detail.value_text ?? "";
  return typeof value === "string" ? value : "";
}

export default function MarketplaceSection({
  projectId,
  origin,
  flatDetails,
  onSaved,
}) {
  const platformLabel = getMarketplaceTabLabel(origin) || "Plataforma";
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const next = {};
    MARKETPLACE_DETAIL_SPECS.forEach((spec) => {
      const detail = findDetailByKey(flatDetails, spec.key);
      next[spec.key] = readDetailValue(detail);
    });
    setValues(next);
  }, [flatDetails]);

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      for (const spec of MARKETPLACE_DETAIL_SPECS) {
        const existing = findDetailByKey(flatDetails, spec.key);
        const value = (values[spec.key] || "").trim();
        if (!value && !existing) continue;
        await upsertProjectDetail(
          projectId,
          {
            key: spec.key,
            category: spec.category,
            label: spec.label,
            value_type: spec.valueType,
          },
          value,
          existing
        );
      }
      onSaved?.();
      showSuccessToast("Informações salvas");
    } catch (err) {
      setError(err.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <section className={sectionStyles.card}>
        <h2 className={sectionStyles.cardTitle}>Informações do {platformLabel}</h2>
        <p className={sectionStyles.cardHint}>
          Links, escopo publicado na plataforma e anotações do chat ficam separados do
          escopo interno do projeto.
        </p>

        <div className={styles.fields}>
          {MARKETPLACE_DETAIL_SPECS.map((spec) => (
            <div key={spec.key} className={styles.field}>
              {spec.multiline ? (
                <>
                  <label className={styles.label} htmlFor={spec.key}>
                    {spec.label}
                  </label>
                  <textarea
                    id={spec.key}
                    className={styles.textarea}
                    value={values[spec.key] || ""}
                    onChange={(e) => setField(spec.key, e.target.value)}
                    placeholder={spec.hint}
                    rows={spec.key.includes("scope") ? 12 : 8}
                  />
                  <p className={styles.fieldHint}>{spec.hint}</p>
                </>
              ) : (
                <Input
                  label={spec.label}
                  type="url"
                  placeholder={spec.placeholder}
                  value={values[spec.key] || ""}
                  onChange={(e) => setField(spec.key, e.target.value)}
                  hint={spec.hint}
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar informações"}
          </Button>
        </div>
      </section>
    </div>
  );
}
