"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import {
  bindingFromEvent,
  findBindingConflict,
  getDefaultBinding,
  getDefaultBindingsMap,
  getActionById,
  isEditableTarget,
  isModifierOnlyEvent,
  isValidBinding,
  matchesBinding,
  mergeBindings,
  readStoredBindings,
  writeStoredBindings,
} from "@/lib/keyboardShortcuts";

const KeyboardShortcutsContext = createContext(null);

function dispatchShortcutAction(actionId) {
  window.dispatchEvent(
    new CustomEvent("myboard:shortcut", { detail: { action: actionId } })
  );
}

export function KeyboardShortcutsProvider({ children }) {
  const { setActiveTab } = useDashboardTab();
  const { clearProject, clearClient, clearLucroFilter } = useDashboardNav();
  const {
    openSearch,
    toggleLeftSidebar,
    toggleRightSidebar,
    refreshAll,
  } = useDashboardLayout();

  const [bindings, setBindingsState] = useState(() => getDefaultBindingsMap());
  const [hydrated, setHydrated] = useState(false);
  const [recordingActionId, setRecordingActionId] = useState(null);

  useEffect(() => {
    function loadBindings() {
      const stored = readStoredBindings();
      setBindingsState(mergeBindings(stored));
      setHydrated(true);
    }

    loadBindings();

    function handleTenantChanged() {
      loadBindings();
    }

    window.addEventListener("myboard:tenant-changed", handleTenantChanged);
    return () => window.removeEventListener("myboard:tenant-changed", handleTenantChanged);
  }, []);

  const persistCustomBindings = useCallback((nextBindings) => {
    const defaults = getDefaultBindingsMap();
    const custom = {};

    Object.entries(nextBindings).forEach(([actionId, binding]) => {
      const defaultBinding = defaults[actionId];
      if (!binding || JSON.stringify(binding) === JSON.stringify(defaultBinding)) return;
      custom[actionId] = binding;
    });

    writeStoredBindings(custom);
  }, []);

  const setBindings = useCallback(
    (updater) => {
      setBindingsState((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        if (hydrated) persistCustomBindings(next);
        return next;
      });
    },
    [hydrated, persistCustomBindings]
  );

  const setBinding = useCallback(
    (actionId, binding) => {
      setBindings((current) => ({
        ...current,
        [actionId]: binding,
      }));
    },
    [setBindings]
  );

  const resetBinding = useCallback(
    (actionId) => {
      const action = getActionById(actionId);
      const defaultBinding = getDefaultBinding(action);
      setBindings((current) => ({
        ...current,
        [actionId]: defaultBinding,
      }));
    },
    [setBindings]
  );

  const resetAllBindings = useCallback(() => {
    const defaults = getDefaultBindingsMap();
    setBindings(defaults);
    writeStoredBindings({});
  }, [setBindings]);

  const startRecording = useCallback((actionId) => {
    setRecordingActionId(actionId);
  }, []);

  const stopRecording = useCallback(() => {
    setRecordingActionId(null);
  }, []);

  const navigateToTab = useCallback(
    (tabId) => {
      if (tabId === "central" || tabId === "agenda" || tabId === "demandas" || tabId === "board") {
        clearProject();
        clearClient();
        clearLucroFilter();
      } else if (tabId === "clientes") {
        clearProject();
        clearLucroFilter();
      } else if (tabId === "projetos") {
        clearClient();
        clearLucroFilter();
      } else if (tabId === "lucro") {
        clearProject();
        clearClient();
      } else if (tabId === "configuracoes") {
        clearProject();
        clearClient();
        clearLucroFilter();
      }

      setActiveTab(tabId);
    },
    [clearProject, clearClient, clearLucroFilter, setActiveTab]
  );

  const executeAction = useCallback(
    (actionId) => {
      switch (actionId) {
        case "search.open":
          openSearch();
          break;
        case "nav.central":
          navigateToTab("central");
          break;
        case "nav.agenda":
          navigateToTab("agenda");
          break;
        case "nav.demandas":
          navigateToTab("demandas");
          break;
        case "nav.board":
          navigateToTab("board");
          break;
        case "nav.projetos":
          navigateToTab("projetos");
          break;
        case "nav.clientes":
          navigateToTab("clientes");
          break;
        case "nav.lucro":
          navigateToTab("lucro");
          break;
        case "nav.settings":
          navigateToTab("configuracoes");
          break;
        case "modal.newEvent":
        case "agenda.today":
        case "agenda.toggleView":
          navigateToTab("agenda");
          dispatchShortcutAction(actionId);
          break;
        case "modal.newClient":
        case "modal.newProject":
        case "modal.newDemand":
          dispatchShortcutAction(actionId);
          break;
        case "layout.toggleLeft":
          toggleLeftSidebar();
          break;
        case "layout.toggleRight":
          toggleRightSidebar();
          break;
        case "layout.refresh":
          refreshAll();
          break;
        default:
          break;
      }
    },
    [navigateToTab, openSearch, toggleLeftSidebar, toggleRightSidebar, refreshAll]
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (recordingActionId) return;

      if (isEditableTarget(event.target)) return;

      const matched = Object.entries(bindings).find(([, binding]) =>
        matchesBinding(event, binding)
      );

      if (!matched) return;

      event.preventDefault();
      executeAction(matched[0]);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bindings, executeAction, recordingActionId]);

  useEffect(() => {
    if (!recordingActionId) return;

    function handleRecordKeyDown(event) {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        stopRecording();
        return;
      }

      if (isModifierOnlyEvent(event)) return;

      const candidate = bindingFromEvent(event);
      if (!isValidBinding(candidate)) return;

      const conflict = findBindingConflict(bindings, recordingActionId, candidate);
      if (conflict) return;

      setBinding(recordingActionId, candidate);
      stopRecording();
    }

    window.addEventListener("keydown", handleRecordKeyDown, true);
    return () => window.removeEventListener("keydown", handleRecordKeyDown, true);
  }, [recordingActionId, bindings, setBinding, stopRecording]);

  const value = useMemo(
    () => ({
      bindings,
      setBinding,
      resetBinding,
      resetAllBindings,
      recordingActionId,
      startRecording,
      stopRecording,
      findBindingConflict: (actionId, candidate) =>
        findBindingConflict(bindings, actionId, candidate),
    }),
    [
      bindings,
      setBinding,
      resetBinding,
      resetAllBindings,
      recordingActionId,
      startRecording,
      stopRecording,
    ]
  );

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const ctx = useContext(KeyboardShortcutsContext);
  if (!ctx) {
    throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
  }
  return ctx;
}
