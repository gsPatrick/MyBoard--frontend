"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { analyzeUpload, applyIngestion } from "@/api/ingestion";
import {
  setBordieActionOverlay,
  forceHideBordieActionOverlay,
} from "@/lib/bordieActionOverlay";
import { getIngestionAuto } from "@/lib/ingestionPrefs";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import styles from "./IngestionUpload.module.css";

const STEPS = [
  { key: "client", label: "Cliente" },
  { key: "project", label: "Projeto" },
  { key: "details", label: "Informações" },
];

const ACCEPT =
  ".zip,.txt,.pdf,.md,.csv,.json,application/pdf,text/plain,application/zip";
const MAX_FILES = 10;

const STATUS_OPTIONS = [
  { value: "", label: "—" },
  { value: "draft", label: "Rascunho" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluído" },
  { value: "paused", label: "Pausado" },
  { value: "cancelled", label: "Cancelado" },
];

const CATEGORY_LABELS = {
  github: "GitHub",
  credentials: "Credenciais",
  scope: "Escopo",
  deployment: "Deploy",
  environment: "Ambiente",
  documentation: "Docs",
  links: "Links",
  notes: "Notas",
  custom: "Outro",
};

export default function IngestionUpload({
  target = {},
  variant = "panel",
  label,
  onApplied,
  fill = false,
}) {
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [files, setFiles] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const isUpdate = Boolean(target.projectId || target.clientId);

  const reset = useCallback(() => {
    setProposal(null);
    setStats(null);
    setFiles([]);
    setError("");
    setStep(0);
  }, []);

  // Aplica a proposta (usado tanto pelo modo manual quanto pelo automático).
  const runApply = useCallback(
    async (proposalData, filesData) => {
      if (!proposalData) return false;
      setApplying(true);
      setError("");
      setBordieActionOverlay(true, "Bordie criando registros…");

      const payload = {
        ...proposalData,
        details: (proposalData.details || []).filter((d) => !d._excluded),
      };

      try {
        const result = await applyIngestion({ proposal: payload, files: filesData, target });
        const a = result.actions || {};
        const summary = [
          a.client ? `cliente ${a.client === "created" ? "criado" : "atualizado"}` : null,
          a.project ? `projeto ${a.project === "created" ? "criado" : "atualizado"}` : null,
          a.details ? `${a.details} detalhe(s)` : null,
          a.files ? `${a.files} arquivo(s)` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        showSuccessToast(`Importação concluída — ${summary || "nada a aplicar"}`);
        window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
        onApplied?.(result);
        reset();
        return true;
      } catch (e) {
        setError(e.message || "Falha ao aplicar a importação.");
        showErrorToast(e.message || "Falha ao aplicar a importação.");
        return false;
      } finally {
        setApplying(false);
        forceHideBordieActionOverlay();
      }
    },
    [target, onApplied, reset]
  );

  const handleFiles = useCallback(
    async (fileList) => {
      const picked = Array.from(fileList || []).slice(0, MAX_FILES);
      if (!picked.length) return;

      setFiles(picked);
      setError("");
      setAnalyzing(true);
      setBordieActionOverlay(true, "Bordie analisando arquivos…");

      let prop = null;
      let sts = null;
      let ok = true;
      try {
        const result = await analyzeUpload(picked, target);
        prop = result.proposal || null;
        sts = result.stats || null;
      } catch (e) {
        ok = false;
        setError(e.message || "Falha ao analisar os arquivos.");
        showErrorToast(e.message || "Falha ao analisar os arquivos.");
        setFiles([]);
      }

      setAnalyzing(false);
      forceHideBordieActionOverlay();
      if (!ok) return;

      setStats(sts);

      // Modo automático: aplica direto, sem abrir o modal de confirmação.
      if (prop && getIngestionAuto()) {
        await runApply(prop, picked);
        return;
      }

      setProposal(prop);
      setStep(0);
    },
    [target, runApply]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onPick = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleApply = () => runApply(proposal, files);

  // Fecha o menu de opções ao clicar fora.
  useEffect(() => {
    if (!menuOpen) return undefined;
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  // Texto colado/digitado vira um .txt e segue o mesmo fluxo de análise.
  const submitText = useCallback(async () => {
    const text = textValue.trim();
    if (!text) return;
    const file = new File([text], "texto-colado.txt", { type: "text/plain" });
    setTextOpen(false);
    setTextValue("");
    await handleFiles([file]);
  }, [textValue, handleFiles]);

  const setClientField = (field, value) =>
    setProposal((p) => ({ ...p, client: { ...(p.client || {}), [field]: value } }));
  const setProjectField = (field, value) =>
    setProposal((p) => ({ ...p, project: { ...(p.project || {}), [field]: value } }));
  const toggleDetail = (index) =>
    setProposal((p) => {
      const details = [...(p.details || [])];
      details[index] = { ...details[index], _excluded: !details[index]._excluded };
      return { ...p, details };
    });
  const setDetailField = (index, field, value) =>
    setProposal((p) => {
      const details = [...(p.details || [])];
      details[index] = { ...details[index], [field]: value };
      return { ...p, details };
    });

  const client = proposal?.client || {};
  const project = proposal?.project || {};
  const details = proposal?.details || [];

  const dropzone =
    variant === "compact" ? (
      <button
        type="button"
        className={`${styles.compact} ${dragOver ? styles.compactOver : ""}`}
        onClick={() => setMenuOpen((o) => !o)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={analyzing}
      >
        <UploadIcon />
        <span>{analyzing ? "Analisando…" : label || "Enviar arquivo para a IA atualizar"}</span>
      </button>
    ) : (
      <div
        className={`${styles.zone} ${dragOver ? styles.zoneOver : ""} ${fill ? styles.zoneFill : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onClick={() => setMenuOpen((o) => !o)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setMenuOpen((o) => !o)}
      >
        <p className={styles.zoneText}>
          {analyzing ? (
            <span>Bordie analisando arquivos…</span>
          ) : (
            <>
              <span>{label || "Arraste arquivos aqui para a IA importar"}</span>
              <span className={styles.zoneSep}> ou </span>
              <span className={styles.zoneLink}>selecione arquivos</span>
            </>
          )}
        </p>
        <span className={styles.zoneHint}>zip, pdf ou txt — cria cliente, projeto e credenciais</span>
      </div>
    );

  return (
    <>
      <div className={styles.chooserWrap} ref={wrapRef}>
        {dropzone}
        {menuOpen && (
          <div className={`${styles.chooser} ${fill ? styles.chooserUp : ""}`} role="menu">
            <button
              type="button"
              className={styles.chooserItem}
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setTextOpen(true);
              }}
            >
              <TextIcon />
              <span className={styles.chooserText}>
                <strong>Colar ou digitar texto</strong>
                <small>Cole de um notepad ou escreva</small>
              </span>
            </button>
            <button
              type="button"
              className={styles.chooserItem}
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                inputRef.current?.click();
              }}
            >
              <UploadIcon />
              <span className={styles.chooserText}>
                <strong>Selecionar arquivo</strong>
                <small>zip, pdf ou txt</small>
              </span>
            </button>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={onPick}
      />

      <Modal
        isOpen={Boolean(proposal)}
        onClose={() => !applying && reset()}
        title={isUpdate ? "Revisar atualização" : "Revisar o que a Bordie encontrou"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={reset} disabled={applying}>
              Cancelar
            </Button>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={applying}>
                Voltar
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={applying}>
                Próximo
              </Button>
            ) : (
              <Button variant="primary" onClick={handleApply} disabled={applying}>
                {applying ? "Aplicando…" : isUpdate ? "Aplicar atualização" : "Criar registros"}
              </Button>
            )}
          </>
        }
      >
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.stepper} role="list" aria-label="Etapas">
          {STEPS.map((s, i) => (
            <button
              type="button"
              key={s.key}
              className={`${styles.stepItem} ${i === step ? styles.stepActive : ""} ${
                i < step ? styles.stepDone : ""
              }`}
              onClick={() => setStep(i)}
              disabled={applying}
            >
              <span className={styles.stepNum}>{i < step ? "✓" : i + 1}</span>
              <span className={styles.stepLabel}>{s.label}</span>
            </button>
          ))}
        </div>

        {stats && step === 0 && (
          <p className={styles.statsLine}>
            {stats.files} arquivo(s) lidos · {details.length} detalhe(s) ·{" "}
            {proposal?.summary ? proposal.summary : "revise e confirme em cada etapa"}
          </p>
        )}

        {step === 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Cliente</h3>
            <div className={styles.grid2}>
              <Input label="Nome" value={client.name || ""} onChange={(e) => setClientField("name", e.target.value)} />
              <Input label="E-mail" value={client.email || ""} onChange={(e) => setClientField("email", e.target.value)} />
              <Input label="Empresa" value={client.company || ""} onChange={(e) => setClientField("company", e.target.value)} />
              <Input label="Telefone" value={client.phone || ""} onChange={(e) => setClientField("phone", e.target.value)} />
              <Input label="Documento" value={client.document || ""} onChange={(e) => setClientField("document", e.target.value)} />
            </div>
          </section>
        )}

        {step === 1 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Projeto</h3>
            <div className={styles.grid2}>
              <Input label="Nome" value={project.name || ""} onChange={(e) => setProjectField("name", e.target.value)} />
              <Input label="Orçamento (R$)" value={project.budget ?? ""} onChange={(e) => setProjectField("budget", e.target.value)} />
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Status</span>
                <select
                  className={styles.select}
                  value={project.status || ""}
                  onChange={(e) => setProjectField("status", e.target.value || null)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Descrição</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={project.description || ""}
                onChange={(e) => setProjectField("description", e.target.value)}
              />
            </label>
          </section>
        )}

        {step === 2 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Informações e credenciais{" "}
              <span className={styles.muted}>(serão salvas no projeto)</span>
            </h3>
            {details.length === 0 && <p className={styles.muted}>Nenhuma informação extraída.</p>}
            <div className={styles.details}>
              {details.map((detail, index) => (
                <div
                  key={index}
                  className={`${styles.detailRow} ${detail._excluded ? styles.detailExcluded : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={!detail._excluded}
                    onChange={() => toggleDetail(index)}
                    aria-label="Incluir detalhe"
                  />
                  <span className={`${styles.badge} ${detail.is_secret ? styles.badgeSecret : ""}`}>
                    {detail.is_secret ? "🔒 " : ""}
                    {CATEGORY_LABELS[detail.category] || detail.category}
                  </span>
                  <input
                    className={styles.detailLabel}
                    value={detail.label || ""}
                    onChange={(e) => setDetailField(index, "label", e.target.value)}
                  />
                  <input
                    className={styles.detailValue}
                    type={detail.is_secret ? "password" : "text"}
                    value={detail.value || ""}
                    onChange={(e) => setDetailField(index, "value", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </Modal>

      <Modal
        isOpen={textOpen}
        onClose={() => !analyzing && setTextOpen(false)}
        title="Colar ou escrever o conteúdo"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTextOpen(false)} disabled={analyzing}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={submitText} disabled={analyzing || !textValue.trim()}>
              {analyzing ? "Analisando…" : "Analisar com a IA"}
            </Button>
          </>
        }
      >
        <p className={styles.notepadHint}>
          Cole o conteúdo (proposta, briefing, e-mail, credenciais…) ou escreva. A Bordie vai ler e
          extrair cliente, projeto e dados.
        </p>
        <textarea
          className={styles.notepad}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Cole aqui o texto ou escreva tudo…"
          rows={14}
          autoFocus
          disabled={analyzing}
        />
      </Modal>
    </>
  );
}

function TextIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
      <rect x="3" y="2.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
      <path
        d="M8 11V3M8 3L5 6M8 3l3 3M3 11.5v1A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
