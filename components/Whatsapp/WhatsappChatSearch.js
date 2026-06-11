"use client";

import { useCallback, useState } from "react";
import Button from "@/components/Button/Button";
import SearchInput from "@/components/SearchInput/SearchInput";
import { searchWhatsappChats } from "@/services/whatsapp";
import styles from "./WhatsappChatSearch.module.css";

export default function WhatsappChatSearch({
  mode = "phone",
  placeholder = "Buscar por nome ou número…",
  onSelect,
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Digite e pressione Enter para buscar.");
  const [results, setResults] = useState([]);

  const searchType = mode === "group" ? "group" : mode === "all" ? "all" : "phone";

  const runSearch = useCallback(
    async (term) => {
      const trimmed = term.trim();
      if (!trimmed) {
        setSubmittedQuery("");
        setResults([]);
        setMessage("Digite e pressione Enter para buscar.");
        return;
      }

      setSubmittedQuery(trimmed);
      setLoading(true);
      setMessage("");

      try {
        const data = await searchWhatsappChats({
          q: trimmed,
          type: searchType,
          limit: 40,
        });

        if (!data?.connected) {
          setResults([]);
          setMessage(data?.message || "Conecte o WhatsApp em Configurações.");
          return;
        }

        setResults(data.results || []);
        setMessage(data.message || (data.results?.length ? "" : "Nenhum resultado para essa busca."));
      } catch (error) {
        setResults([]);
        setMessage(error.message || "Não foi possível buscar conversas.");
      } finally {
        setLoading(false);
      }
    },
    [searchType]
  );

  function handleSubmit(event) {
    event?.preventDefault?.();
    runSearch(query);
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          disabled={disabled || loading}
          aria-label="Buscar WhatsApp"
          shortcut=""
        />
        <Button type="submit" size="sm" disabled={disabled || loading || !query.trim()}>
          {loading ? "Buscando…" : "Buscar"}
        </Button>
      </form>

      {submittedQuery && !loading && (
        <p className={styles.hint}>
          Resultados para <strong>{submittedQuery}</strong>
        </p>
      )}
      {loading && <p className={styles.hint}>Buscando…</p>}
      {!loading && message && <p className={styles.hint}>{message}</p>}

      {results.length > 0 && (
        <ul className={styles.list}>
          {results.map((item) => (
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
                      <strong>{item.name || item.display || "Grupo"}</strong>
                      <small>Grupo WhatsApp</small>
                    </>
                  ) : (
                    <>
                      <strong>{item.name || item.display}</strong>
                      <small>{item.display !== item.name ? item.display : item.phone_e164 || item.external_id}</small>
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
