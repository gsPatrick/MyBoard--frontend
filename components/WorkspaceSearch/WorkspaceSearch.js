"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Kbd from "@/components/Kbd/Kbd";
import Avatar from "@/components/Avatar/Avatar";
import { listClients } from "@/services/clients";
import { listProjects } from "@/services/projects";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import { normalizeListResponse } from "@/lib/apiList";
import { formatBinding } from "@/lib/keyboardShortcuts";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { useKeyboardShortcuts } from "@/context/KeyboardShortcutsContext";
import styles from "./WorkspaceSearch.module.css";

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const PROJECT_STATUS = {
  in_progress: "Em andamento",
  completed: "Concluído",
  paused: "Pausado",
  cancelled: "Cancelado",
};

function useDebouncedValue(value, delay = 280) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function WorkspaceSearch() {
  const { searchOpen, closeSearch } = useDashboardLayout();
  const { selectProject, selectClient } = useDashboardNav();
  const { bindings } = useKeyboardShortcuts();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const debouncedQuery = useDebouncedValue(query);

  const flatResults = useMemo(() => {
    const items = [];
    clients.forEach((client) => {
      items.push({ type: "client", data: client });
    });
    projects.forEach((project) => {
      items.push({ type: "project", data: project });
    });
    return items;
  }, [clients, projects]);

  const runSearch = useCallback(async (term) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setClients([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await ensureActiveTenant();
      const [clientsData, projectsData] = await Promise.all([
        listClients({ search: trimmed, limit: 8 }),
        listProjects({ search: trimmed, limit: 8 }),
      ]);
      setClients(normalizeListResponse(clientsData));
      setProjects(normalizeListResponse(projectsData));
    } catch {
      setClients([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    setQuery("");
    setClients([]);
    setProjects([]);
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);

    function handleEscape(event) {
      if (event.key === "Escape") closeSearch();
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (!searchOpen) return;
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch, searchOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [flatResults.length, debouncedQuery]);

  function handleSelect(item) {
    if (!item) return;

    if (item.type === "client") {
      selectClient(item.data);
    } else {
      selectProject(item.data);
    }

    closeSearch();
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(flatResults.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(flatResults[activeIndex]);
    }
  }

  if (!searchOpen) return null;

  const hasQuery = query.trim().length > 0;
  const showEmpty = hasQuery && !loading && flatResults.length === 0;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeSearch();
      }}
    >
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Pesquisar">
        <div className={styles.inputRow}>
          <span className={styles.inputIcon}>
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="search"
            className={styles.input}
            placeholder="Pesquisar projeto, cliente ou informação..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={styles.results}>
          {!hasQuery && (
            <p className={styles.empty}>Digite para buscar clientes e projetos</p>
          )}
          {hasQuery && loading && <p className={styles.loading}>Buscando...</p>}
          {showEmpty && <p className={styles.empty}>Nenhum resultado encontrado</p>}

          {!loading && clients.length > 0 && (
            <div className={styles.group}>
              <p className={styles.groupLabel}>Clientes</p>
              {clients.map((client) => {
                const index = flatResults.findIndex(
                  (item) => item.type === "client" && item.data.id === client.id
                );
                return (
                  <button
                    key={client.id}
                    type="button"
                    className={`${styles.item} ${index === activeIndex ? styles.itemActive : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect({ type: "client", data: client })}
                  >
                    <Avatar src={getClientAvatarUrl(client)} name={client.name} size="sm" />
                    <div className={styles.itemMain}>
                      <p className={styles.itemTitle}>{client.name}</p>
                      <p className={styles.itemMeta}>
                        {[client.company, client.email].filter(Boolean).join(" · ") || "Cliente"}
                      </p>
                    </div>
                    <span className={styles.itemType}>Cliente</span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className={styles.group}>
              <p className={styles.groupLabel}>Projetos</p>
              {projects.map((project) => {
                const index = flatResults.findIndex(
                  (item) => item.type === "project" && item.data.id === project.id
                );
                const clientName = project.client?.name;
                return (
                  <button
                    key={project.id}
                    type="button"
                    className={`${styles.item} ${index === activeIndex ? styles.itemActive : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect({ type: "project", data: project })}
                  >
                    <Avatar
                      src={getClientAvatarUrl(project.client)}
                      name={clientName || project.name}
                      size="sm"
                    />
                    <div className={styles.itemMain}>
                      <p className={styles.itemTitle}>{project.name}</p>
                      <p className={styles.itemMeta}>
                        {[clientName, PROJECT_STATUS[project.status] || project.status]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className={styles.itemType}>Projeto</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navegar · <Kbd>Enter</Kbd> abrir · <Kbd>Esc</Kbd> fechar
          </span>
          <span>
            <Kbd>{formatBinding(bindings["search.open"])}</Kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
