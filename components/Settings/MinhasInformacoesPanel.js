"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { listDocuments, uploadDocument, deleteDocument } from "@/api/documents";
import { fetchMediaBlobUrl } from "@/api/media";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./MinhasInformacoesPanel.module.css";

const CATEGORIES = [
  { id: "cv", label: "Currículo" },
  { id: "contract", label: "Contrato" },
  { id: "other", label: "Arquivo" },
];

const CATEGORY_LABELS = { cv: "Currículo", contract: "Contrato", other: "Arquivo" };

const LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês", "Outro"];

function formatSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export default function MinhasInformacoesPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [category, setCategory] = useState("cv");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("Português");
  const [purpose, setPurpose] = useState("");
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDocuments();
      setDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar seus documentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) {
      showErrorToast("Selecione um arquivo.");
      return;
    }
    setUploading(true);
    try {
      await uploadDocument({
        file,
        title: title.trim() || file.name,
        category,
        language: category === "cv" ? language : undefined,
        purpose: category === "contract" ? purpose.trim() : undefined,
      });
      showSuccessToast("Documento salvo.");
      setTitle("");
      setPurpose("");
      setFile(null);
      await load();
    } catch (error) {
      showErrorToast(error.message || "Falha ao enviar o documento.");
    } finally {
      setUploading(false);
    }
  }

  async function openDoc(doc, download = false) {
    setBusyId(doc.id);
    try {
      const url = await fetchMediaBlobUrl(doc.id);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.original_name || doc.title || "documento";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      } else {
        window.open(url, "_blank", "noopener");
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (error) {
      showErrorToast(error.message || "Não foi possível abrir o arquivo.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Excluir "${doc.title}"?`)) return;
    setBusyId(doc.id);
    try {
      await deleteDocument(doc.id);
      showSuccessToast("Removido.");
      await load();
    } catch (error) {
      showErrorToast(error.message || "Falha ao remover.");
    } finally {
      setBusyId(null);
    }
  }

  const groups = CATEGORIES.map((c) => ({
    ...c,
    items: docs.filter((d) => (d.category || "other") === c.id),
  }));

  return (
    <SettingsPanelShell
      title="Minhas informações"
      hint="Currículo, contratos e arquivos seus de fácil acesso — e que o Bordie pode te entregar no chat."
    >
      <form className={settingsPanelStyles.card} onSubmit={handleUpload}>
        <h3 className={settingsPanelStyles.cardTitle}>Adicionar documento</h3>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Tipo</span>
            <select
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Nome / título"
            placeholder={category === "contract" ? "Ex.: Contrato padrão de serviço" : "Ex.: Currículo 2026"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {category === "cv" && (
            <label className={styles.field}>
              <span className={styles.label}>Idioma</span>
              <select
                className={styles.select}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          )}

          {category === "contract" && (
            <Input
              label="Para que serve"
              placeholder="Ex.: fechar projetos, NDA, prestação de serviço"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          )}
        </div>

        <label className={styles.fileRow}>
          <input
            type="file"
            className={styles.fileInput}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
          />
          <span className={styles.fileName}>{file ? file.name : "Nenhum arquivo selecionado"}</span>
        </label>

        <div className={styles.actions}>
          <Button type="submit" size="sm" disabled={uploading || !file}>
            {uploading ? "Enviando…" : "Salvar documento"}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className={settingsPanelStyles.muted}>Carregando…</p>
      ) : (
        groups.map((group) =>
          group.items.length === 0 ? null : (
            <article key={group.id} className={settingsPanelStyles.card}>
              <h3 className={settingsPanelStyles.cardTitle}>{group.label}</h3>
              <div className={styles.list}>
                {group.items.map((doc) => (
                  <div key={doc.id} className={styles.docRow}>
                    <div className={styles.docInfo}>
                      <p className={styles.docTitle}>{doc.title}</p>
                      <p className={styles.docMeta}>
                        {[
                          CATEGORY_LABELS[doc.category],
                          doc.language,
                          doc.purpose,
                          formatSize(doc.size_bytes),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className={styles.docActions}>
                      <button
                        type="button"
                        className={styles.docBtn}
                        onClick={() => openDoc(doc, false)}
                        disabled={busyId === doc.id}
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        className={styles.docBtn}
                        onClick={() => openDoc(doc, true)}
                        disabled={busyId === doc.id}
                      >
                        Baixar
                      </button>
                      <button
                        type="button"
                        className={`${styles.docBtn} ${styles.docDelete}`}
                        onClick={() => handleDelete(doc)}
                        disabled={busyId === doc.id}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )
        )
      )}

      {!loading && docs.length === 0 && (
        <p className={settingsPanelStyles.muted}>
          Nenhum documento ainda. Envie seu currículo e contratos acima.
        </p>
      )}
    </SettingsPanelShell>
  );
}
