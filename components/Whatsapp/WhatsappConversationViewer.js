"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button/Button";
import {
  formatWhatsappPhone,
  listClientWhatsappThreads,
  listProjectWhatsappThreads,
  listWhatsappConversationMessages,
} from "@/api/whatsapp";
import { showErrorToast } from "@/lib/toast";
import sectionStyles from "@/components/ProjectDetail/ProjectDetailSection.module.css";
import styles from "./WhatsappConversationViewer.module.css";

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPreview(message) {
  if (!message) return "Sem mensagens ainda";
  if (message.body_text) return message.body_text;
  if (message.content_type && message.content_type !== "text") {
    return `[${message.content_type}]`;
  }
  return "Mensagem";
}

function threadLabel(thread) {
  if (thread.link_type === "group") {
    return thread.label || thread.display || "Grupo WhatsApp";
  }
  return thread.label || formatWhatsappPhone(thread.phone_digits || thread.external_id);
}

export default function WhatsappConversationViewer({ clientId, projectId }) {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThreadKey, setActiveThreadKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState(null);

  const scopeParams = useMemo(
    () => ({
      clientId: clientId || null,
      projectId: projectId || null,
    }),
    [clientId, projectId]
  );

  const loadThreads = useCallback(async () => {
    if (!clientId && !projectId) return;

    setLoadingThreads(true);
    try {
      const data = clientId
        ? await listClientWhatsappThreads(clientId)
        : await listProjectWhatsappThreads(projectId);

      const items = Array.isArray(data) ? data : data?.items || [];
      setThreads(items);

      if (items.length === 1) {
        setActiveThreadKey(items[0].link_id);
      }
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar conversas.");
    } finally {
      setLoadingThreads(false);
    }
  }, [clientId, projectId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.link_id === activeThreadKey) || null,
    [threads, activeThreadKey]
  );

  const loadMessages = useCallback(
    async ({ append = false, before = null } = {}) => {
      const conversationId = activeThread?.conversation?.id;
      if (!conversationId) {
        setMessages([]);
        setHasMore(false);
        setNextBefore(null);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingMessages(true);
      }

      try {
        const data = await listWhatsappConversationMessages(conversationId, {
          ...scopeParams,
          before,
          limit: 50,
        });

        const items = Array.isArray(data?.items) ? data.items : [];
        setHasMore(Boolean(data?.has_more));
        setNextBefore(data?.next_before || null);
        setMessages((current) => (append ? [...items, ...current] : items));
      } catch (error) {
        showErrorToast(error.message || "Não foi possível carregar mensagens.");
      } finally {
        setLoadingMessages(false);
        setLoadingMore(false);
      }
    },
    [activeThread, scopeParams]
  );

  useEffect(() => {
    if (!activeThread?.conversation?.id) {
      setMessages([]);
      setHasMore(false);
      setNextBefore(null);
      return;
    }

    loadMessages();
  }, [activeThread?.conversation?.id, loadMessages]);

  const totalMessages = threads.reduce(
    (sum, thread) => sum + (thread.conversation?.message_count || 0),
    0
  );

  if (loadingThreads) {
    return <p className={sectionStyles.empty}>Carregando conversas…</p>;
  }

  if (threads.length === 0) {
    return null;
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Conversas ingeridas</h3>
        {totalMessages > 0 && <span className={styles.badgeCount}>{totalMessages} msgs</span>}
      </div>

      <p className={styles.hint}>
        Mensagens capturadas pelo webhook após o WhatsApp conectado e o vínculo feito.
        Histórico antigo pode ser importado pelo backfill nas configurações.
      </p>

      <ul className={styles.threadList}>
        {threads.map((thread) => {
          const count = thread.conversation?.message_count || 0;
          const isActive = activeThreadKey === thread.link_id;

          return (
            <li key={thread.link_id}>
              <button
                type="button"
                className={`${styles.threadButton} ${isActive ? styles.threadButtonActive : ""}`}
                onClick={() => setActiveThreadKey(thread.link_id)}
              >
                <div className={styles.threadTop}>
                  <span className={styles.threadName}>{threadLabel(thread)}</span>
                  <span className={styles.threadMeta}>
                    {count > 0
                      ? `${count} msg${count === 1 ? "" : "s"}`
                      : "Aguardando mensagens"}
                  </span>
                </div>
                <span className={styles.threadPreview}>
                  {count > 0
                    ? formatPreview(thread.conversation?.last_message)
                    : "Nenhuma mensagem ingerida para este vínculo ainda."}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {activeThread && (
        <div className={styles.messagesPanel}>
          <div className={styles.messagesHeader}>
            {threadLabel(activeThread)}
            {activeThread.conversation?.last_message_at && (
              <span className={styles.threadMeta}>
                {" · "}
                última {formatMessageTime(activeThread.conversation.last_message_at)}
              </span>
            )}
          </div>

          {!activeThread.conversation?.id ? (
            <p className={`${sectionStyles.empty} ${styles.emptyThread}`}>
              Vincule o número/grupo, mantenha o WhatsApp conectado e envie uma mensagem de teste.
            </p>
          ) : loadingMessages ? (
            <p className={sectionStyles.empty}>Carregando mensagens…</p>
          ) : messages.length === 0 ? (
            <p className={`${sectionStyles.empty} ${styles.emptyThread}`}>
              Nenhuma mensagem encontrada nesta conversa.
            </p>
          ) : (
            <>
              <div className={styles.messagesList}>
                {messages.map((message) => {
                  const outbound = message.direction === "outbound";
                  return (
                    <div
                      key={message.id}
                      className={`${styles.messageRow} ${
                        outbound ? styles.messageOutbound : styles.messageInbound
                      }`}
                    >
                      {!outbound && activeThread.link_type === "group" && message.sender_name && (
                        <span className={styles.messageSender}>{message.sender_name}</span>
                      )}
                      <div className={styles.messageBubble}>
                        {message.body_text ||
                          (message.content_type !== "text"
                            ? `[${message.content_type}]`
                            : "Mensagem")}
                      </div>
                      <span className={styles.messageTime}>{formatMessageTime(message.sent_at)}</span>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className={styles.loadMore}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loadingMore}
                    onClick={() => loadMessages({ append: true, before: nextBefore })}
                  >
                    {loadingMore ? "Carregando…" : "Carregar anteriores"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
