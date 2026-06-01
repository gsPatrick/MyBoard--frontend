"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SearchInput from "@/components/SearchInput/SearchInput";
import { searchWhatsappChats } from "@/api/whatsapp";
import styles from "./WhatsappChatSearch.module.css";

export default function WhatsappChatSearch({
  mode = "phone",
  placeholder = "Buscar número no WhatsApp conectado…",
  onSelect,
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);

  const searchType = mode === "group" ? "group" : mode === "all" ? "all" : "phone";

  const runSearch = useCallback(
    async (term) => {
      setLoading(true);
      setMessage("");
      try {
        const data = await searchWhatsappChats({
          q: term,
          type: searchType,
          limit: 30,
        });

        if (!data?.connected) {
          setResults([]);
          setMessage(data?.message || "Conecte o WhatsApp em Configurações.");
          return;
        }

        setResults(data.results || []);
        if (!data.results?.length) {
          setMessage(term ? "Nenhum resultado para essa busca." : "Nenhuma conversa encontrada.");
        }
      } catch (error) {
        setResults([]);
        setMessage(error.message || "Não foi possível buscar conversas.");
      } finally {
        setLoading(false);
      }
    },
    [searchType]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      runSearch(query.trim());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const visibleResults = useMemo(() => results.slice(0, 20), [results]);

  return (
    <div className={styles.wrap}>
      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        disabled={disabled || loading}
        aria-label="Buscar WhatsApp"
      />

      {loading && <p className={styles.hint}>Buscando…</p>}
      {!loading && message && <p className={styles.hint}>{message}</p>}

      {visibleResults.length > 0 && (
        <ul className={styles.list}>
          {visibleResults.map((item) => (
            <li key={`${item.type}:${item.jid || item.external_id}`}>
              <button
                type="button"
                className={styles.item}
                disabled={disabled}
                onClick={() => onSelect?.(item)}
              >
                <span className={styles.itemMain}>
                  {item.type === "group" ? (
                    <>
                      <strong>{item.name || "Grupo"}</strong>
                      <small>Grupo · {item.external_id}</small>
                    </>
                  ) : (
                    <>
                      <strong>{item.display}</strong>
                      {item.name && item.name !== item.display && <small>{item.name}</small>}
                    </>
                  )}
                </span>
                <span className={styles.addLabel}>Vincular</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
