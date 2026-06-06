"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import Modal from "@/components/Modal/Modal";
import { listDocuments, uploadDocument, deleteDocument } from "@/api/documents";
import { fetchMediaBlobUrl } from "@/api/media";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import SettingsPanelShell from "./SettingsPanelShell";
import sectionStyles from "@/components/ProjectDetail/ProjectDetailSection.module.css";
import styles from "./MinhasInformacoesPanel.module.css";

const LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês", "Outro"];

const SECTIONS = [
  {
    id: "cv",
    title: "Currículo",
    hint: "Seu currículo em um ou mais idiomas — o Bordie entrega quando você pedir.",
    addLabel: "Adicionar currículo",
  },
  {
    id: "contract",
    title: "Contratos",
    hint: "Modelos de contrato (ex.: contrato padrão para fechar projetos, NDA).",
    addLabel: "Adicionar contrato",
  },
  {
    id: "other",
    title: "Outros arquivos",
    hint: "Qualquer arquivo de fácil acesso (portfólio, propostas, tabelas…).",
    addLabel: "Adicionar arquivo",
  },
];

function formatSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export default function MinhasInformacoesPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [modalCat, setModalCat] = useState(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("Português");
  const [purpose, setPurpose] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  function openModal(category) {
    setModalCat(category);
    setTitle("");
    setLanguage("Português");
    setPurpose("");
    setFile(null);
  }

  function closeModal() {
    if (uploading) return;
    setModalCat(null);
  }

  async function handleUpload() {
    if (!file) {
      showErrorToast("Selecione um arquivo.");
      return;
    }
    setUploading(true);
    try {
      await uploadDocument({
        file,
        title: title.trim() || file.name,
        category: modalCat,
        language: modalCat === "cv" ? language : undefined,
        purpose: modalCat === "contract" ? purpose.trim() : undefined,
      });
      showSuccessToast("Documento salvo.");
      setModalCat(null);
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

  return (
    <SettingsPanelShell
      title="Minhas informações"
      hint="Currículo, contratos e arquivos seus de fácil acesso — e que o Bordie entrega no chat."
    >
      {SECTIONS.map((section) => {
        const items = docs.filter((d) => (d.category || "other") === section.id);
        return (
          <section key={section.id} className={sectionStyles.card}>
            <div className={sectionStyles.cardHeader}>
              <div>
                <h2 className={sectionStyles.cardTitle}>{section.title}</h2>
                <p className={sectionStyles.cardHint}>{section.hint}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => openModal(section.id)}>
                {section.addLabel}
              </Button>
            </div>

            {loading ? (
              <p className={sectionStyles.empty}>Carregando…</p>
            ) : items.length === 0 ? (
              <p className={sectionStyles.empty}>Nada por aqui ainda.</p>
            ) : (
              <div className={sectionStyles.list}>
                {items.map((doc) => (
                  <div key={doc.id} className={sectionStyles.item}>
                    <div className={sectionStyles.itemMain}>
                      <p className={sectionStyles.itemTitle}>{doc.title}</p>
                      <p className={sectionStyles.itemMeta}>
                        {[doc.language, doc.purpose, formatSize(doc.size_bytes)]
                          .filter(Boolean)
                          .join(" · ") || doc.original_name}
                      </p>
                    </div>
                    <div className={sectionStyles.itemActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDoc(doc, false)}
                        disabled={busyId === doc.id}
                      >
                        Abrir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDoc(doc, true)}
                        disabled={busyId === doc.id}
                      >
                        Baixar
                      </Button>
                      <button
                        type="button"
                        className={sectionStyles.iconBtn}
                        title="Excluir"
                        onClick={() => handleDelete(doc)}
                        disabled={busyId === doc.id}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <Modal
        isOpen={Boolean(modalCat)}
        onClose={closeModal}
        title={
          modalCat === "cv"
            ? "Adicionar currículo"
            : modalCat === "contract"
              ? "Adicionar contrato"
              : "Adicionar arquivo"
        }
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeModal} disabled={uploading}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpload} disabled={uploading || !file}>
              {uploading ? "Enviando…" : "Salvar"}
            </Button>
          </>
        }
      >
        <div className={sectionStyles.formGrid}>
          <div className={sectionStyles.formFull}>
            <button
              type="button"
              className={`${styles.drop} ${file ? styles.dropFilled : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className={styles.dropIcon} aria-hidden="true">
                ⬆
              </span>
              <span className={styles.dropText}>
                {file ? file.name : "Clique para selecionar o arquivo"}
              </span>
              <span className={styles.dropHint}>PDF, DOC, imagem ou texto</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className={sectionStyles.formFull}>
            <Input
              label="Nome / título"
              placeholder={
                modalCat === "contract" ? "Ex.: Contrato padrão de serviço" : "Ex.: Currículo 2026"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {modalCat === "cv" && (
            <div className={sectionStyles.formFull}>
              <label className={sectionStyles.fieldLabel} htmlFor="doc-language">
                Idioma
              </label>
              <select
                id="doc-language"
                className={sectionStyles.select}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalCat === "contract" && (
            <div className={sectionStyles.formFull}>
              <Input
                label="Para que serve"
                placeholder="Ex.: fechar projetos, NDA, prestação de serviço"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>
    </SettingsPanelShell>
  );
}
