"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Chip from "@/components/Chip/Chip";
import { updateProject } from "@/api/projects";
import {
  PROJECT_CHIP_STATUS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_OPTIONS,
} from "@/lib/projectLabels";
import { showSuccessToast } from "@/lib/toast";
import styles from "./ProjectStatusMenu.module.css";

function getMenuPosition(triggerEl) {
  if (!triggerEl) return { top: 0, left: 0 };

  const rect = triggerEl.getBoundingClientRect();
  const menuWidth = 168;
  const menuHeight = PROJECT_STATUS_OPTIONS.length * 36 + 8;
  const gap = 6;

  let top = rect.bottom + gap;
  let left = rect.right - menuWidth;

  if (left < 8) left = 8;
  if (left + menuWidth > window.innerWidth - 8) {
    left = window.innerWidth - menuWidth - 8;
  }
  if (top + menuHeight > window.innerHeight - 8) {
    top = rect.top - menuHeight - gap;
  }

  return { top, left };
}

export default function ProjectStatusMenu({ project, onUpdated }) {
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(project.status);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setStatus(project.status);
  }, [project.status]);

  useLayoutEffect(() => {
    if (!open) return;
    setMenuStyle(getMenuPosition(triggerRef.current));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (
        wrapRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    function handleReposition() {
      setMenuStyle(getMenuPosition(triggerRef.current));
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  async function handleSelect(nextStatus) {
    if (nextStatus === status || saving) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProject(project.id, { status: nextStatus });
      const merged = { ...project, ...updated, status: updated.status || nextStatus };
      setStatus(merged.status);
      onUpdated?.(merged);
      showSuccessToast("Status atualizado");
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
      setOpen(false);
    } catch {
      /* mantém status anterior */
    } finally {
      setSaving(false);
    }
  }

  const statusConfig =
    PROJECT_CHIP_STATUS[status] || PROJECT_CHIP_STATUS.in_progress;

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        className={styles.menu}
        role="listbox"
        aria-label="Alterar status do projeto"
        style={{ top: menuStyle.top, left: menuStyle.left }}
      >
        {PROJECT_STATUS_OPTIONS.map((option) => {
          const config = PROJECT_CHIP_STATUS[option];
          const isActive = option === status;

          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={isActive}
              className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                handleSelect(option);
              }}
            >
              <Chip status={config.chip}>{PROJECT_STATUS_LABELS[option]}</Chip>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        disabled={saving}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status: ${PROJECT_STATUS_LABELS[status] || statusConfig.label}. Clique para alterar`}
      >
        <Chip status={statusConfig.chip}>
          {PROJECT_STATUS_LABELS[status] || statusConfig.label}
        </Chip>
      </button>
      {menu}
    </div>
  );
}
