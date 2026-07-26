"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Kbd from "@/components/Kbd/Kbd";
import Avatar from "@/components/Avatar/Avatar";
import Modal from "@/components/Modal/Modal";
import { listClients } from "@/services/clients";
import { listProjects } from "@/services/projects";
import { getProjectDetail } from "@/services/projectDetails";
import { loadGroupedProjectDetails } from "@/lib/projectDetailsHelpers";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { getClientAvatarUrl, getProjectLogoUrl } from "@/lib/mediaUrl";
import { normalizeListResponse } from "@/lib/apiList";
import { formatBinding } from "@/lib/keyboardShortcuts";
import {
  parseSearchQuery,
  buildProjectDataItems,
  filterDataItems,
  buildCopyFields,
} from "@/lib/workspaceSearchScope";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
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
  recurring: "Recorrente",
};

const DATA_TYPE_LABEL = {
  credential: "Credencial",
  github: "GitHub",
  link: "Link",
  detail: "Dado",
};

function useDebouncedValue(value, delay = 280) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

async function copyToClipboard(value) {
  try {
    await navigator.clipboard.writeText(String(value));
    showSuccessToast("Copiado");
  } catch {
    showErrorToast("Não foi possível copiar");
  }
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

  // Busca escopada (projeto:filtro)
  const [scopedProject, setScopedProject] = useState(null);
  const [dataItems, setDataItems] = useState([]);
  const [scopedLoading, setScopedLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [revealing, setRevealing] = useState(false);

  const debouncedQuery = useDebouncedValue(query);
  const { isScoped, scope, filter } = useMemo(
    () => parseSearchQuery(debouncedQuery),
    [debouncedQuery]
  );

  const filteredItems = useMemo(
    () => filterDataItems(dataItems, filter),
    [dataItems, filter]
  );

  const flatResults = useMemo(() => {
    const items = [];
    clients.forEach((client) => items.push({ type: "client", data: client }));
    projects.forEach((project) => items.push({ type: "project", data: project }));
    return items;
  }, [clients, projects]);

  const navItems = isScoped ? filteredItems : flatResults;

  // Fecha o modal antes de fechar a busca no Esc
  const selectedRef = useRef(null);
  useEffect(() => {
    selectedRef.current = selectedItem;
  }, [selectedItem]);

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

  // Resolve o projeto do escopo e carrega seus dados.
  useEffect(() => {
    if (!searchOpen || !isScoped || !scope) {
      setScopedProject(null);
      setDataItems([]);
      setScopedLoading(false);
      return undefined;
    }

    let active = true;
    (async () => {
      setScopedLoading(true);
      try {
        await ensureActiveTenant();
        const data = await listProjects({ search: scope, limit: 5 });
        const list = normalizeListResponse(data);
        const lower = scope.toLowerCase();
        const project =
          list.find((p) => p.name?.toLowerCase() === lower) || list[0] || null;

        if (!active) return;
        setScopedProject(project);

        if (project) {
          const grouped = await loadGroupedProjectDetails(project.id);
          if (!active) return;
          setDataItems(buildProjectDataItems(grouped || {}));
        } else {
          setDataItems([]);
        }
      } catch {
        if (active) {
          setScopedProject(null);
          setDataItems([]);
        }
      } finally {
        if (active) setScopedLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [searchOpen, isScoped, scope]);

  // Busca normal (clientes + projetos) quando não é escopada.
  useEffect(() => {
    if (!searchOpen) return;
    if (isScoped) {
      setClients([]);
      setProjects([]);
      setLoading(false);
      return;
    }
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch, searchOpen, isScoped]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    setQuery("");
    setClients([]);
    setProjects([]);
    setActiveIndex(0);
    setSelectedItem(null);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);

    function handleEscape(event) {
      if (event.key !== "Escape") return;
      if (selectedRef.current) {
        setSelectedItem(null);
        return;
      }
      closeSearch();
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    setActiveIndex(0);
  }, [navItems.length, debouncedQuery]);

  function handleSelect(item) {
    if (!item) return;
    if (item.type === "client") selectClient(item.data);
    else selectProject(item.data);
    closeSearch();
  }

  async function openDataItem(item) {
    if (!item) return;
    try {
      let revealed = null;
      if (item.type === "credential" || item.detail?.is_secret) {
        setRevealing(true);
        revealed = await getProjectDetail(scopedProject.id, item.id, {
          revealSecrets: true,
        });
      }
      const fields = buildCopyFields(item, revealed);
      setSelectedItem({ item, fields });
    } catch {
      showErrorToast("Não foi possível carregar os dados");
    } finally {
      setRevealing(false);
    }
  }

  function handleKeyDown(event) {
    if (selectedItem) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(navItems.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = navItems[activeIndex];
      if (isScoped) openDataItem(item);
      else handleSelect(item);
    }
  }

  if (!searchOpen) return null;

  const hasQuery = query.trim().length > 0;
  const showNormalEmpty =
    !isScoped && hasQuery && !loading && flatResults.length === 0;

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
            placeholder="Pesquisar... (dica: projeto:filtro, ex.: selletiva:vpn)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={styles.results}>
          {!hasQuery && (
            <p className={styles.empty}>
              Busque clientes e projetos — ou use <strong>projeto:filtro</strong> (ex.:{" "}
              <strong>selletiva:vpn</strong>) para achar dados de um projeto.
            </p>
          )}

          {/* ----- Modo escopado (projeto:filtro) ----- */}
          {isScoped && (
            <>
              {scopedLoading && <p className={styles.loading}>Carregando dados...</p>}

              {!scopedLoading && scope && !scopedProject && (
                <p className={styles.empty}>
                  Nenhum projeto encontrado para “{scope}”.
                </p>
              )}

              {!scopedLoading && !scope && (
                <p className={styles.empty}>Digite o nome do projeto antes dos dois-pontos.</p>
              )}

              {!scopedLoading && scopedProject && filteredItems.length === 0 && (
                <p className={styles.empty}>
                  Nenhum dado {filter ? `com “${filter}” ` : ""}em {scopedProject.name}.
                </p>
              )}

              {!scopedLoading && scopedProject && filteredItems.length > 0 && (
                <div className={styles.group}>
                  <p className={styles.groupLabel}>{scopedProject.name} · dados</p>
                  {filteredItems.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.item} ${idx === activeIndex ? styles.itemActive : ""}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => openDataItem(item)}
                    >
                      <span className={styles.dataDot} aria-hidden="true" />
                      <div className={styles.itemMain}>
                        <p className={styles.itemTitle}>{item.label}</p>
                        <p className={styles.itemMeta}>{item.sublabel}</p>
                      </div>
                      <span className={styles.itemType}>
                        {DATA_TYPE_LABEL[item.type] || "Dado"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ----- Modo normal (clientes + projetos) ----- */}
          {!isScoped && hasQuery && loading && <p className={styles.loading}>Buscando...</p>}
          {showNormalEmpty && <p className={styles.empty}>Nenhum resultado encontrado</p>}

          {!isScoped && !loading && clients.length > 0 && (
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

          {!isScoped && !loading && projects.length > 0 && (
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
                      src={getProjectLogoUrl(project)}
                      name={project.name || clientName}
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
            <Kbd>↓</Kbd> navegar · <Kbd>Enter</Kbd> {isScoped ? "abrir dados" : "abrir"} ·{" "}
            <Kbd>Esc</Kbd> fechar
          </span>
          <span>
            <Kbd>{formatBinding(bindings["search.open"])}</Kbd>
          </span>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.item?.label || "Dados"}
        size="sm"
      >
        {revealing ? (
          <p className={styles.loading}>Carregando...</p>
        ) : selectedItem?.fields?.length ? (
          <div className={styles.copyList}>
            {selectedItem.fields.map((field) => (
              <div key={field.label} className={styles.copyRow}>
                <div className={styles.copyInfo}>
                  <span className={styles.copyLabel}>{field.label}</span>
                  <span className={styles.copyValue}>{field.value}</span>
                </div>
                <div className={styles.copyActions}>
                  {field.isLink && (
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.copyBtn}
                    >
                      Abrir
                    </a>
                  )}
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => copyToClipboard(field.value)}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Sem dados para exibir.</p>
        )}
      </Modal>
    </div>
  );
}
