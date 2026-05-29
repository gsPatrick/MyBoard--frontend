"use client";

import { useMemo, useState } from "react";
import Avatar from "@/components/Avatar/Avatar";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import styles from "./ProjectPicker.module.css";

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeFolderLabel(project, currentFolderId) {
  if (project.folder_id === currentFolderId) return null;
  if (!project.folder_id) return "Na raiz";
  return project.folder?.name ? `Em: ${project.folder.name}` : "Em outra pasta";
}

export default function ProjectPicker({
  projects = [],
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  loading = false,
  currentFolderId = null,
  emptyMessage = "Nenhum projeto encontrado",
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) => {
      const clientName = project.client?.name || "";
      return (
        project.name?.toLowerCase().includes(term) ||
        clientName.toLowerCase().includes(term)
      );
    });
  }, [projects, query]);

  const selectedCount = selectedIds.size;

  return (
    <div className={styles.wrap}>
      <div className={styles.searchRow}>
        <span className={styles.searchIcon}>
          <SearchIcon />
        </span>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar projeto ou cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className={styles.meta}>
        <span className={styles.metaText}>
          {selectedCount} selecionado{selectedCount === 1 ? "" : "s"}
        </span>
        {onSelectAll && projects.length > 0 && (
          <button type="button" className={styles.selectAll} onClick={onSelectAll}>
            Selecionar todos
          </button>
        )}
        {onClearAll && selectedCount > 0 && (
          <button type="button" className={styles.selectAll} onClick={onClearAll}>
            Limpar
          </button>
        )}
      </div>

      <div className={styles.list} role="listbox" aria-multiselectable="true">
        {loading && <p className={styles.loading}>Carregando projetos...</p>}
        {!loading && filtered.length === 0 && (
          <p className={styles.empty}>{emptyMessage}</p>
        )}
        {!loading &&
          filtered.map((project) => {
            const isSelected = selectedIds.has(project.id);
            const folderLabel = normalizeFolderLabel(project, currentFolderId);
            const clientName = project.client?.name;

            return (
              <button
                key={project.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.item} ${isSelected ? styles.itemSelected : ""}`}
                onClick={() => onToggle(project.id)}
              >
                <span className={styles.check}>
                  {isSelected && <CheckIcon />}
                </span>
                <Avatar
                  src={getClientAvatarUrl(project.client)}
                  name={clientName || project.name}
                  size="sm"
                />
                <div className={styles.itemMain}>
                  <p className={styles.itemTitle}>{project.name}</p>
                  {clientName && <p className={styles.itemMeta}>{clientName}</p>}
                </div>
                {folderLabel && <span className={styles.badge}>{folderLabel}</span>}
              </button>
            );
          })}
      </div>
    </div>
  );
}
