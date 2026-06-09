"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/Button/Button";
import Text from "@/components/Text/Text";
import { listProjects } from "@/api/projects";
import {
  listChats,
  createChat,
  updateChat,
  deleteChat,
  listChatMessages,
  sendChatMessage,
} from "@/api/chats";
import { normalizeListResponse } from "@/lib/apiList";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import styles from "./ChatsView.module.css";

/* Renderiza texto preservando quebras e destacando blocos de código ```...``` */
function renderContent(text) {
  const parts = String(text || "").split(/```/);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const firstNl = part.indexOf("\n");
      const code = firstNl >= 0 ? part.slice(firstNl + 1) : part;
      return (
        <pre key={i} className={styles.codeBlock}>
          <code>{code.replace(/\n$/, "")}</code>
        </pre>
      );
    }
    return (
      <span key={i} className={styles.textPart}>
        {part}
      </span>
    );
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatsView() {
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all"); // all | none | <projectId>
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  const activeChat = useMemo(() => chats.find((c) => c.id === activeId) || null, [chats, activeId]);

  /* ----- carregamentos ----- */
  useEffect(() => {
    listProjects({ limit: 200 })
      .then((data) => setProjects(normalizeListResponse(data).items || []))
      .catch(() => setProjects([]));
  }, []);

  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const params = {};
      if (projectFilter === "none") params.project_id = "none";
      else if (projectFilter !== "all") params.project_id = projectFilter;
      const data = await listChats(params);
      setChats(Array.isArray(data) ? data : []);
    } catch (e) {
      showErrorToast(e.message || "Não foi possível carregar as conversas.");
    } finally {
      setLoadingChats(false);
    }
  }, [projectFilter]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const openChat = useCallback(async (id) => {
    setActiveId(id);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      const data = await listChatMessages(id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      showErrorToast(e.message || "Não foi possível abrir a conversa.");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  /* ----- ações de chat ----- */
  async function handleNewChat() {
    try {
      const projectId = projectFilter !== "all" && projectFilter !== "none" ? projectFilter : null;
      const chat = await createChat({ project_id: projectId });
      setChats((prev) => [chat, ...prev]);
      setActiveId(chat.id);
      setMessages([]);
    } catch (e) {
      showErrorToast(e.message || "Não foi possível criar a conversa.");
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm("Apagar esta conversa?")) return;
    try {
      await deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch (err) {
      showErrorToast(err.message || "Não foi possível apagar.");
    }
  }

  async function patchActive(partial) {
    if (!activeChat) return;
    try {
      const updated = await updateChat(activeChat.id, partial);
      setChats((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      showErrorToast(e.message || "Não foi possível salvar.");
    }
  }

  async function handleAttach(fileList) {
    const files = Array.from(fileList || []).slice(0, 5);
    const next = [];
    for (const f of files) {
      try {
        const data = await fileToDataUrl(f);
        next.push({ name: f.name, mime: f.type, data });
      } catch {
        /* ignore */
      }
    }
    setAttachments((prev) => [...prev, ...next]);
  }

  async function handleSend() {
    if (!activeChat || sending) return;
    const text = input.trim();
    if (!text && !attachments.length) return;

    const optimisticUser = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      attachments: attachments.map((a) => ({ name: a.name, mime: a.mime })),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");
    const sentAttachments = attachments;
    setAttachments([]);
    setSending(true);

    try {
      const res = await sendChatMessage(activeChat.id, { content: text, attachments: sentAttachments });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        res.user,
        res.reply,
      ]);
      if (res.chat) setChats((prev) => prev.map((c) => (c.id === res.chat.id ? res.chat : c)));
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(text);
      setAttachments(sentAttachments);
      showErrorToast(e.message || "Falha ao enviar.");
    } finally {
      setSending(false);
    }
  }

  function onComposerKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const projectName = (id) => projects.find((p) => p.id === id)?.name || null;

  return (
    <div className={styles.wrap}>
      {/* ---------- conversas ---------- */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <select
            className={styles.select}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">Todas as conversas</option>
            <option value="none">Sem projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm" icon="+" fullWidth onClick={handleNewChat}>
            Nova conversa
          </Button>
        </div>

        <div className={styles.chatList}>
          {loadingChats ? (
            <p className={styles.muted}>Carregando…</p>
          ) : chats.length === 0 ? (
            <p className={styles.muted}>Nenhuma conversa ainda.</p>
          ) : (
            chats.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.chatItem} ${activeId === c.id ? styles.chatItemActive : ""}`}
                onClick={() => openChat(c.id)}
              >
                <span className={styles.chatTitle}>{c.title || "Nova conversa"}</span>
                <span className={styles.chatMeta}>
                  {c.project_id ? projectName(c.project_id) || "Projeto" : "Sem projeto"}
                </span>
                <span className={styles.chatDelete} onClick={(e) => handleDelete(c.id, e)} title="Apagar">
                  ✕
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ---------- conversa ---------- */}
      <section className={styles.main}>
        {!activeChat ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💬</span>
            <Text variant="h3">Converse com o Bordie sobre seus projetos</Text>
            <Text muted>
              Crie uma conversa, defina as instruções do sistema e desenvolva com o contexto do
              projeto já carregado.
            </Text>
            <Button variant="primary" onClick={handleNewChat}>
              Nova conversa
            </Button>
          </div>
        ) : (
          <>
            <header className={styles.mainHeader}>
              <input
                className={styles.titleInput}
                value={activeChat.title || ""}
                onChange={(e) =>
                  setChats((prev) =>
                    prev.map((c) => (c.id === activeChat.id ? { ...c, title: e.target.value } : c))
                  )
                }
                onBlur={(e) => patchActive({ title: e.target.value })}
              />
              <button
                type="button"
                className={styles.settingsToggle}
                onClick={() => setSettingsOpen((o) => !o)}
                title="Configurações da conversa"
              >
                ⚙︎
              </button>
            </header>

            <div className={styles.messages} ref={scrollRef}>
              {loadingMsgs ? (
                <p className={styles.muted}>Carregando mensagens…</p>
              ) : messages.length === 0 ? (
                <p className={styles.muted}>Mande a primeira mensagem.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`${styles.msg} ${m.role === "user" ? styles.msgUser : styles.msgAssistant}`}
                  >
                    <span className={styles.msgRole}>{m.role === "user" ? "Você" : "Bordie"}</span>
                    <div className={styles.msgBody}>{renderContent(m.content)}</div>
                    {m.attachments?.length > 0 && (
                      <div className={styles.msgAttachments}>
                        {m.attachments.map((a, i) => (
                          <span key={i} className={styles.attachChip}>
                            📎 {a.name || "arquivo"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              {sending && <p className={styles.typing}>Bordie está pensando…</p>}
            </div>

            <div className={styles.composer}>
              {attachments.length > 0 && (
                <div className={styles.composerAttachments}>
                  {attachments.map((a, i) => (
                    <span key={i} className={styles.attachChip}>
                      📎 {a.name}
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.composerRow}>
                <button
                  type="button"
                  className={styles.attachBtn}
                  onClick={() => fileRef.current?.click()}
                  title="Anexar arquivo"
                >
                  📎
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    handleAttach(e.target.files);
                    e.target.value = "";
                  }}
                />
                <textarea
                  className={styles.textarea}
                  placeholder="Mensagem para o Bordie… (Enter envia, Shift+Enter quebra linha)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onComposerKey}
                  rows={1}
                />
                <Button variant="primary" size="sm" onClick={handleSend} disabled={sending}>
                  {sending ? "…" : "Enviar"}
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ---------- run settings ---------- */}
      {activeChat && settingsOpen && (
        <aside className={styles.settings}>
          <Text variant="label" muted>
            Configurações da conversa
          </Text>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Projeto</span>
            <select
              className={styles.select}
              value={activeChat.project_id || ""}
              onChange={(e) => patchActive({ project_id: e.target.value || null })}
            >
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>System instructions</span>
            <textarea
              className={styles.sysArea}
              placeholder="Ex.: Você é meu parceiro de dev neste projeto. Responda com foco em código, seja objetivo…"
              defaultValue={activeChat.system_instructions || ""}
              onBlur={(e) => patchActive({ system_instructions: e.target.value })}
              rows={8}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Modelo (opcional)</span>
            <input
              className={styles.input}
              placeholder="padrão da conta"
              defaultValue={activeChat.model || ""}
              onBlur={(e) => patchActive({ model: e.target.value || null })}
            />
          </label>

          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={activeChat.settings?.use_project_context !== false}
              onChange={(e) => patchActive({ settings: { use_project_context: e.target.checked } })}
            />
            <span>
              <strong>Usar contexto do projeto</strong>
              <br />
              <span className={styles.hint}>Injeta detalhes e conversas (RAG) do projeto vinculado.</span>
            </span>
          </label>
        </aside>
      )}
    </div>
  );
}
