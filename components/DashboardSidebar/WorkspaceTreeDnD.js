"use client";

import { useCallback, useRef, useState } from "react";
import { reorderWorkspace } from "@/api/folders";
import { ensureActiveTenant } from "@/lib/tenantContext";
import {
  DND_MIME,
  applyFolderDrop,
  applyProjectDrop,
  createDragPayload,
  flattenWorkspaceForReorder,
  parseDragPayload,
} from "@/lib/workspaceTree";
import { attachWorkspaceDragGhost } from "./dragGhost";
import styles from "./DashboardSidebar.module.css";

function findFolderInTree(nodes, folderId) {
  for (const folder of nodes || []) {
    if (folder.id === folderId) return folder;
    const nested = findFolderInTree(folder.children, folderId);
    if (nested) return nested;
  }
  return null;
}

const PRESS_MS = 90;

export function useWorkspaceTreeDnD(workspace, setWorkspace, setExpandedIds) {
  const [dragItem, setDragItem] = useState(null);
  const [pressingItem, setPressingItem] = useState(null);
  const [dropHint, setDropHint] = useState(null);
  const [saving, setSaving] = useState(false);
  const suppressClickRef = useRef(false);
  const pressTimerRef = useRef(null);

  const clearPressing = useCallback(() => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setPressingItem(null);
  }, []);

  const persistWorkspace = useCallback(
    async (nextWorkspace) => {
      setSaving(true);
      const previous = workspace;

      try {
        await ensureActiveTenant();
        const payload = flattenWorkspaceForReorder(nextWorkspace);
        const result = await reorderWorkspace(payload);
        setWorkspace({
          tree: result?.tree || [],
          rootFiles: result?.rootFiles || [],
        });
        window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
      } catch {
        setWorkspace(previous);
      } finally {
        setSaving(false);
        setDragItem(null);
        setDropHint(null);
      }
    },
    [workspace, setWorkspace]
  );

  const handleDragStart = useCallback((event, type, id, label) => {
    event.stopPropagation();
    clearPressing();
    event.dataTransfer.setData(DND_MIME, createDragPayload(type, id));
    event.dataTransfer.effectAllowed = "move";
    attachWorkspaceDragGhost(event, type, label, {
      root: styles.dragGhost,
      icon: styles.dragGhostIcon,
      label: styles.dragGhostLabel,
    });
    setDragItem({ type, id });
  }, [clearPressing]);

  const handleDragEnd = useCallback(() => {
    clearPressing();
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 120);
    setDragItem(null);
    setDropHint(null);
  }, [clearPressing]);

  const guardClick = useCallback((handler) => {
    return (event) => {
      if (suppressClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handler(event);
    };
  }, []);

  const handleDragOver = useCallback((event, hint) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropHint(hint);
  }, []);

  const handleDragLeave = useCallback(
    (event, hintKey) => {
      if (dropHint?.key !== hintKey) return;
      const related = event.relatedTarget;
      if (related && event.currentTarget.contains(related)) return;
      setDropHint(null);
    },
    [dropHint]
  );

  const handleDropOnFolder = useCallback(
    async (event, folderId) => {
      event.preventDefault();
      event.stopPropagation();

      const item = parseDragPayload(event.dataTransfer.getData(DND_MIME)) || dragItem;
      if (!item || saving) return;

      if (item.type === "project") {
        const folder = findFolderInTree(workspace.tree, folderId);
        const index = folder?.files?.length ?? 0;
        const next = applyProjectDrop(workspace, item.id, { type: "folder", folderId, index });
        if (!next) return;
        setExpandedIds((prev) => new Set(prev).add(folderId));
        await persistWorkspace(next);
        return;
      }

      if (item.type === "folder") {
        const parent = findFolderInTree(workspace.tree, folderId);
        const index = parent?.children?.length ?? 0;
        const next = applyFolderDrop(workspace, item.id, { type: "folder", folderId, index });
        if (!next) return;
        setExpandedIds((prev) => new Set(prev).add(folderId));
        await persistWorkspace(next);
      }
    },
    [dragItem, persistWorkspace, saving, setExpandedIds, workspace]
  );

  const handleDropOnRoot = useCallback(
    async (event, kind) => {
      event.preventDefault();
      event.stopPropagation();

      const item = parseDragPayload(event.dataTransfer.getData(DND_MIME)) || dragItem;
      if (!item || saving) return;

      if (kind === "projects" && item.type === "project") {
        const next = applyProjectDrop(workspace, item.id, {
          type: "root",
          index: workspace.rootFiles?.length ?? 0,
        });
        if (!next) return;
        await persistWorkspace(next);
        return;
      }

      if (kind === "folders" && item.type === "folder") {
        const next = applyFolderDrop(workspace, item.id, {
          type: "root",
          index: workspace.tree?.length ?? 0,
        });
        if (!next) return;
        await persistWorkspace(next);
      }
    },
    [dragItem, persistWorkspace, saving, workspace]
  );

  const isDragging = useCallback(
    (type, id) => dragItem?.type === type && dragItem?.id === id,
    [dragItem]
  );

  const isPressing = useCallback(
    (type, id) => pressingItem?.type === type && pressingItem?.id === id,
    [pressingItem]
  );

  const getDraggableProps = useCallback(
    (type, id, label) => ({
      draggable: !saving,
      onPointerDown: (event) => {
        if (saving || event.button !== 0) return;
        clearPressing();
        pressTimerRef.current = window.setTimeout(() => {
          setPressingItem({ type, id });
        }, PRESS_MS);
      },
      onPointerUp: clearPressing,
      onPointerCancel: clearPressing,
      onPointerLeave: (event) => {
        const related = event.relatedTarget;
        if (related && event.currentTarget.contains(related)) return;
        clearPressing();
      },
      onDragStart: (event) => handleDragStart(event, type, id, label),
      onDragEnd: handleDragEnd,
    }),
    [clearPressing, handleDragEnd, handleDragStart, saving]
  );

  const getFolderDropProps = useCallback(
    (folderId) => {
      const key = `folder:${folderId}`;
      const isActive = dropHint?.key === key;
      return {
        onDragOver: (event) => handleDragOver(event, { key, folderId }),
        onDragLeave: (event) => handleDragLeave(event, key),
        onDrop: (event) => handleDropOnFolder(event, folderId),
        className: isActive ? styles.dropTargetActive : "",
      };
    },
    [dropHint, handleDragLeave, handleDragOver, handleDropOnFolder]
  );

  const getRootDropProps = useCallback(
    (kind) => {
      const key = `root:${kind}`;
      const isActive = dropHint?.key === key;
      return {
        onDragOver: (event) => handleDragOver(event, { key, kind }),
        onDragLeave: (event) => handleDragLeave(event, key),
        onDrop: (event) => handleDropOnRoot(event, kind),
        className: isActive ? styles.dropZoneActive : styles.dropZone,
      };
    },
    [dropHint, handleDragLeave, handleDragOver, handleDropOnRoot]
  );

  return {
    saving,
    dragItem,
    isDragging,
    isPressing,
    guardClick,
    getDraggableProps,
    getFolderDropProps,
    getRootDropProps,
  };
}
