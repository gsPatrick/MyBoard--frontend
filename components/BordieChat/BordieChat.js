"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Kbd from "@/components/Kbd/Kbd";
import IconButton from "@/components/IconButton/IconButton";
import {
  executeBordieAction,
  getBordiePolicy,
  isAbortError,
  isBoardAction,
  sendBordieCommand,
  sendBordieMessage,
} from "@/api/bordie";
import {
  BordieActionConfirm,
  BordieEntityList,
  renderRichText,
} from "./BordieRich";
import { getWorkspaceSettings } from "@/api/settings";
import {
  beginBordieActionPreparing,
  beginBordieActionOverlay,
  endBordieActionOverlay,
  executeBordieActionCore,
  forceHideBordieActionOverlay,
  getBordieActionOverlayLabel,
  paintOverlayFrame,
  updateBordieActionOverlayLabel,
} from "@/lib/bordieActionOverlay";
import { getStoredUser } from "@/api/client";
import { useBordieChat } from "@/context/BordieChatContext";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import { useKeyboardShortcuts } from "@/context/KeyboardShortcutsContext";
import { buildBordieContextWithFreshBoard } from "@/lib/bordieBoardSnapshot";
import {
  buildBordieContext,
  filterBordieActions,
  getBordieActions,
  groupBordieActions,
} from "@/lib/bordieActions";
import {
  BORDIE_DEFAULT_SIZE,
  BORDIE_DISPLAY,
  BORDIE_DOCK_PANEL,
  clampBordiePosition,
  clampBordieSize,
  computeBordieResize,
  getCenteredPosition,
  isNearBordieDockSnap,
  readBordiePrefs,
  shouldSnapBordieToDock,
  writeBordiePrefs,
} from "@/lib/bordieLayout";
import { formatBinding } from "@/lib/keyboardShortcuts";
import styles from "./BordieChat.module.css";

const CHAT_WELCOME =
  "Oi! Sou o Bordie. Converse comigo — também executo ações quando precisar.";

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5l1.4 3.4 3.6.3-2.7 2.3.8 3.5L8 10.4 4.9 12l.8-3.5-2.7-2.3 3.6-.3L8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 13V3M8 3L4 7M8 3l4 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11 3v10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function FloatIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 2.5h4M8 2.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 4L6 8l4 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function createChatMessage(role, content, extra = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    entities: extra.entities || null,
    pendingAction: extra.pendingAction || null,
  };
}

const STATUS_CLASS = {
  loading: "statusLoading",
  info: "statusInfo",
  success: "statusSuccess",
  error: "statusError",
};

function persistPrefs({ size, position, displayMode, dockPanel }) {
  const current = readBordiePrefs();
  writeBordiePrefs({
    ...current,
    ...(size ? { size } : {}),
    ...(position !== undefined ? { position } : {}),
    ...(displayMode ? { displayMode } : {}),
    ...(dockPanel ? { dockPanel } : {}),
  });
}

export default function BordieChat() {
  const { bordieOpen, bordieDocked, displayMode, closeBordie, dockBordie, floatBordie, boardContext } =
    useBordieChat();
  const { activeTab, setActiveTab } = useDashboardTab();
  const {
    selectedProject,
    selectedClient,
    selectProject,
    selectClient,
    clearProject,
    clearClient,
    clearLucroFilter,
  } = useDashboardNav();
  const {
    openSearch,
    refreshAll,
    boardFullscreen,
    boardFullscreenBordieHidden,
    setBoardFullscreenBordieHidden,
  } = useDashboardLayout();
  const { bindings } = useKeyboardShortcuts();

  const [mounted, setMounted] = useState(false);
  const [dockRoot, setDockRoot] = useState(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [size, setSize] = useState(BORDIE_DEFAULT_SIZE);
  const [position, setPosition] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [nearDockSnap, setNearDockSnap] = useState(false);
  const [dockPanel, setDockPanel] = useState(BORDIE_DOCK_PANEL.CHAT);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [chatMessages, setChatMessages] = useState(() => [
    createChatMessage("assistant", CHAT_WELCOME),
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [policyMode, setPolicyMode] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(true);

  const commandInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatListRef = useRef(null);
  const panelRef = useRef(null);
  const interactionRef = useRef(null);
  const sizeRef = useRef(BORDIE_DEFAULT_SIZE);

  const context = useMemo(
    () => buildBordieContext({ activeTab, selectedProject, selectedClient, boardContext, policyMode }),
    [activeTab, selectedProject, selectedClient, boardContext, policyMode]
  );

  useEffect(() => {
    getBordiePolicy()
      .then((data) => setPolicyMode(data?.mode || null))
      .catch(() => {});

    getWorkspaceSettings()
      .then((data) => setAiConfigured(Boolean(data?.ai?.configured)))
      .catch(() => {});

    function handlePolicyUpdated() {
      getBordiePolicy()
        .then((data) => setPolicyMode(data?.mode || null))
        .catch(() => {});
    }

    function handleAiUpdated() {
      getWorkspaceSettings()
        .then((data) => setAiConfigured(Boolean(data?.ai?.configured)))
        .catch(() => {});
    }

    window.addEventListener("myboard:bordie-policy-updated", handlePolicyUpdated);
    window.addEventListener("myboard:ai-settings-updated", handleAiUpdated);
    return () => {
      window.removeEventListener("myboard:bordie-policy-updated", handlePolicyUpdated);
      window.removeEventListener("myboard:ai-settings-updated", handleAiUpdated);
    };
  }, []);

  const appendChatAssistant = useCallback((content, extra = {}) => {
    setChatMessages((current) => [...current, createChatMessage("assistant", content, extra)]);
  }, []);

  const updatePending = useCallback((id, patch) => {
    setChatMessages((current) =>
      current.map((m) =>
        m.id === id && m.pendingAction
          ? { ...m, pendingAction: { ...m.pendingAction, ...patch } }
          : m
      )
    );
  }, []);

  const handleOpenEntity = useCallback(
    (target) => {
      if (!target?.kind) return;
      const { kind, id, name } = target;
      if (kind === "project") {
        selectProject({ id, name });
      } else if (kind === "client") {
        selectClient({ id, name });
      } else if (kind === "agenda") {
        setActiveTab("agenda");
      }
      if (displayMode !== BORDIE_DISPLAY.DOCKED) closeBordie();
    },
    [selectProject, selectClient, setActiveTab, displayMode, closeBordie]
  );

  // Executa uma ação de workspace e atualiza o card de confirmação correspondente.
  const runWorkspaceActionNow = useCallback(
    async (messageId, action) => {
      updatePending(messageId, { state: "running" });
      try {
        const res = await executeBordieAction({ action, confirmed: true });
        if (res?.ok) {
          updatePending(messageId, {
            state: "done",
            resultMessage: res.result?.message || "Feito.",
            resultEntity: res.result?.entity || null,
          });
        } else {
          updatePending(messageId, {
            state: "error",
            resultMessage: res?.reason || "Não foi possível executar a ação.",
          });
        }
      } catch (error) {
        updatePending(messageId, {
          state: "error",
          resultMessage: error.message || "Falha ao executar a ação.",
        });
      }
    },
    [updatePending]
  );

  const cancelPending = useCallback(
    (messageId) => updatePending(messageId, { state: "cancelled" }),
    [updatePending]
  );

  // Seletor de cliente ao criar projeto: vincular a um cliente existente.
  const pickClientForProject = useCallback(
    (messageId, action, client) => {
      const finalAction = {
        ...action,
        status: "ready",
        payload: { ...action.payload, client_id: client.id },
      };
      return runWorkspaceActionNow(messageId, finalAction);
    },
    [runWorkspaceActionNow]
  );

  // Seletor de cliente: criar um cliente novo e, em seguida, o projeto.
  const createClientForProject = useCallback(
    async (messageId, action, name) => {
      updatePending(messageId, { state: "running" });
      try {
        const clientRes = await executeBordieAction({
          action: { type: "client_create", payload: { name } },
          confirmed: true,
        });
        const clientId = clientRes?.ok ? clientRes.result?.entity?.id : null;
        if (!clientId) {
          updatePending(messageId, {
            state: "error",
            resultMessage: clientRes?.reason || "Não consegui criar o cliente.",
          });
          return;
        }
        const projectRes = await executeBordieAction({
          action: {
            type: "project_create",
            payload: { ...action.payload, client_id: clientId },
          },
          confirmed: true,
        });
        if (projectRes?.ok) {
          updatePending(messageId, {
            state: "done",
            resultMessage: projectRes.result?.message || "Projeto criado.",
            resultEntity: projectRes.result?.entity || null,
          });
        } else {
          updatePending(messageId, {
            state: "error",
            resultMessage: projectRes?.reason || "Não consegui criar o projeto.",
          });
        }
      } catch (error) {
        updatePending(messageId, {
          state: "error",
          resultMessage: error.message || "Falha ao criar.",
        });
      }
    },
    [updatePending]
  );

  const processAssistantResponse = useCallback(
    async (response, { wasPreparing = false } = {}) => {
      const { reply, action, actions, entities } = response;
      const allActions = (actions?.length ? actions : action ? [action] : []).filter(Boolean);
      const boardAction = allActions.find((item) => isBoardAction(item));
      const workspaceActions = allActions.filter((item) => !isBoardAction(item));

      // Overlay apenas para ação de board (fluxo do canvas — mantido separado).
      if (boardAction) {
        if (wasPreparing) {
          updateBordieActionOverlayLabel(getBordieActionOverlayLabel(boardAction));
        } else {
          beginBordieActionOverlay(boardAction);
        }
        await paintOverlayFrame();
      } else if (wasPreparing) {
        forceHideBordieActionOverlay();
      }

      // Mensagem do assistente: texto + cards de entidades.
      if (reply || entities?.length) {
        appendChatAssistant(reply || "", { entities: entities || null });
      }

      // Ação de board: fluxo existente (aplica cena / overlay).
      if (boardAction) {
        try {
          await executeBordieActionCore(boardAction, {
            executeRemote: executeBordieAction,
            policyMode,
          });
        } catch (error) {
          forceHideBordieActionOverlay();
          throw error;
        } finally {
          endBordieActionOverlay();
        }
      }

      // Ações de workspace: seletor de cliente, confirmação inline ou execução automática.
      for (const wsAction of workspaceActions) {
        if (wsAction.status === "needs_client") {
          const pickerMsg = createChatMessage("assistant", "", {
            pendingAction: { action: wsAction, state: "choosing_client" },
          });
          setChatMessages((current) => [...current, pickerMsg]);
          continue;
        }

        const needsConfirm =
          wsAction.requires_confirmation === true || policyMode === "always_confirm";
        const msg = createChatMessage("assistant", "", {
          pendingAction: { action: wsAction, state: needsConfirm ? "pending" : "running" },
        });
        setChatMessages((current) => [...current, msg]);
        if (!needsConfirm) {
          await runWorkspaceActionNow(msg.id, wsAction);
        }
      }
    },
    [appendChatAssistant, policyMode, runWorkspaceActionNow]
  );

  const userName = getStoredUser()?.name?.trim().split(" ")[0] || "Você";
  const isDocked = displayMode === BORDIE_DISPLAY.DOCKED;
  const boardFullscreenDock =
    activeTab === "board" && boardFullscreen && isDocked;
  const showActionsPane = !isDocked || dockPanel === BORDIE_DOCK_PANEL.ACTIONS;
  const showChatPane = !isDocked || dockPanel === BORDIE_DOCK_PANEL.CHAT;

  const setDockPanelPref = useCallback((panel) => {
    setDockPanel(panel);
    persistPrefs({ dockPanel: panel });
  }, []);

  useEffect(() => {
    setMounted(true);
    const prefs = readBordiePrefs();
    setSize(clampBordieSize(prefs.size));
    setPosition(prefs.position);
    setDockPanel(prefs.dockPanel);
  }, []);

  useEffect(() => {
    if (!bordieDocked) {
      setDockRoot(null);
      return undefined;
    }

    const findRoot = () => document.getElementById("bordie-dock-root");
    setDockRoot(findRoot());

    const timer = window.setInterval(() => {
      const root = findRoot();
      setDockRoot((current) => current || root);
    }, 50);

    return () => window.clearInterval(timer);
  }, [bordieDocked]);

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

  const runPrompt = useCallback(
    async (prompt) => {
      const trimmed = prompt.trim();
      if (!trimmed || isRunning) return;

      setIsRunning(true);
      setStatusMessage({ type: "loading", text: "Bordie está processando…" });
      const wasPreparing = beginBordieActionPreparing(trimmed, context);
      const requestContext = await buildBordieContextWithFreshBoard({
        activeTab,
        selectedProject,
        selectedClient,
        boardContext,
        policyMode,
      });

      try {
        const response = await sendBordieCommand({ prompt: trimmed, context: requestContext });
        const resultText = response.message || "Comando recebido.";
        setStatusMessage({
          type: response.offline || !aiConfigured ? "info" : "success",
          text: resultText,
        });

        await processAssistantResponse(
          {
            reply: resultText,
            entities: response.entities,
            action: response.action,
            actions: response.actions,
          },
          { wasPreparing }
        );
      } catch (error) {
        forceHideBordieActionOverlay();
        setStatusMessage({
          type: isAbortError(error) ? "info" : "error",
          text: isAbortError(error)
            ? "Processamento cancelado."
            : error.message || "Não foi possível executar o comando.",
        });
      } finally {
        setIsRunning(false);
      }
    },
    [activeTab, selectedProject, selectedClient, boardContext, policyMode, isRunning, processAssistantResponse, aiConfigured]
  );

  const handlers = useMemo(
    () => ({
      navigateToTab,
      openSearch: () => {
        openSearch();
        closeBordie();
      },
      refreshAll,
      runPrompt: (prompt) => {
        setQuery(prompt);
        runPrompt(prompt);
      },
      onHelp: () => {
        setQuery("");
        setStatusMessage({
          type: "info",
          text: `Você está em ${context.activeTabLabel}. Digite o que quer fazer ou escolha uma ação.`,
        });
      },
    }),
    [navigateToTab, openSearch, closeBordie, refreshAll, runPrompt, context.activeTabLabel]
  );

  const allActions = useMemo(() => getBordieActions(context, handlers), [context, handlers]);
  const filteredActions = useMemo(
    () => filterBordieActions(allActions, query),
    [allActions, query]
  );
  const groupedActions = useMemo(() => groupBordieActions(filteredActions), [filteredActions]);

  const flatActions = useMemo(() => {
    const items = [];
    groupedActions.forEach(([, actions]) => items.push(...actions));
    return items;
  }, [groupedActions]);

  useEffect(() => {
    if (!bordieOpen) return undefined;

    setQuery("");
    setActiveIndex(0);
    setStatusMessage(null);
    setChatInput("");
    setChatError("");

    if (!isDocked) {
      const prefs = readBordiePrefs();
      setPosition(prefs.position || getCenteredPosition(clampBordieSize(prefs.size)));
    }

    const timer = window.setTimeout(() => {
      if (isDocked) {
        if (dockPanel === BORDIE_DOCK_PANEL.ACTIONS) {
          commandInputRef.current?.focus();
        } else {
          chatInputRef.current?.focus();
        }
      } else {
        commandInputRef.current?.focus();
      }
    }, 0);

    function handleEscape(event) {
      if (event.key === "Escape") closeBordie();
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [bordieOpen, closeBordie, isDocked, dockPanel]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, flatActions.length]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    if (!bordieOpen || !chatListRef.current) return;
    chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [bordieOpen, chatMessages.length, chatLoading]);

  const finishInteraction = useCallback(
    (event) => {
      const session = interactionRef.current;
      if (!session || !panelRef.current) return;

      if (panelRef.current.hasPointerCapture?.(event.pointerId)) {
        panelRef.current.releasePointerCapture(event.pointerId);
      }

      const rect = panelRef.current.getBoundingClientRect();

      if (session.type === "drag" && shouldSnapBordieToDock(rect)) {
        dockBordie();
      } else {
        persistPrefs({
          size: { width: rect.width, height: rect.height },
          position: { x: rect.left, y: rect.top },
        });
      }

      interactionRef.current = null;
      setIsDragging(false);
      setIsResizing(false);
      setNearDockSnap(false);
    },
    [dockBordie]
  );

  const handlePanelPointerMove = useCallback(
    (event) => {
      const session = interactionRef.current;
      if (!session || !panelRef.current) return;

      if (session.type === "drag") {
        const currentSize = sizeRef.current;
        const nextPosition = clampBordiePosition(
          {
            x: event.clientX - session.offsetX,
            y: event.clientY - session.offsetY,
          },
          currentSize
        );

        setPosition(nextPosition);
        setNearDockSnap(
          isNearBordieDockSnap({
            right: nextPosition.x + currentSize.width,
          })
        );
        return;
      }

      if (session.type === "resize" && session.startRect && session.corner) {
        const next = computeBordieResize(
          session.corner,
          session.startRect,
          event.clientX,
          event.clientY
        );
        setPosition({ x: next.x, y: next.y });
        setSize({ width: next.width, height: next.height });
      }
    },
    []
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return undefined;

    function onPointerMove(event) {
      handlePanelPointerMove(event);
    }

    function onPointerEnd(event) {
      finishInteraction(event);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [isDragging, isResizing, handlePanelPointerMove, finishInteraction]);

  const beginDrag = useCallback(
    (event) => {
      if (isDocked || event.button !== 0 || event.target.closest("button") || !panelRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const rect = panelRef.current.getBoundingClientRect();
      panelRef.current.setPointerCapture(event.pointerId);

      interactionRef.current = {
        type: "drag",
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };

      setPosition({ x: rect.left, y: rect.top });
      setIsDragging(true);
      setNearDockSnap(false);
    },
    [isDocked]
  );

  const beginResize = useCallback(
    (event, corner) => {
      if (isDocked || event.button !== 0 || !panelRef.current) return;

      event.preventDefault();
      event.stopPropagation();

      const rect = panelRef.current.getBoundingClientRect();
      panelRef.current.setPointerCapture(event.pointerId);

      interactionRef.current = {
        type: "resize",
        corner,
        startRect: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
      };

      setPosition({ x: rect.left, y: rect.top });
      setSize({ width: rect.width, height: rect.height });
      setIsResizing(true);
    },
    [isDocked]
  );

  async function runAction(action) {
    if (!action || isRunning) return;

    setStatusMessage({ type: "loading", text: `Executando: ${action.label}…` });
    setIsRunning(true);

    try {
      await action.run?.();
      const doneText = `Pronto: ${action.label}`;
      setStatusMessage({ type: "success", text: doneText });
      appendChatAssistant(doneText);

      if (action.id.startsWith("nav.") || action.id === "search.open") {
        closeBordie();
      }
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message || `Falha ao executar “${action.label}”.`,
      });
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSubmitPrompt() {
    const trimmed = query.trim();
    if (!trimmed || isRunning) return;

    const selected = flatActions[activeIndex];
    if (selected && flatActions.length > 0) {
      await runAction(selected);
      return;
    }

    await runPrompt(trimmed);
  }

  function handleCommandKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(flatActions.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSubmitPrompt();
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const userMessage = createChatMessage("user", trimmed);
    const nextMessages = [...chatMessages, userMessage];

    setChatMessages(nextMessages);
    setChatInput("");
    setChatError("");
    setChatLoading(true);
    const wasPreparing = beginBordieActionPreparing(trimmed, context);

    try {
      const requestContext = await buildBordieContextWithFreshBoard({
        activeTab,
        selectedProject,
        selectedClient,
        boardContext,
        policyMode,
      });
      const history = nextMessages.map(({ role, content }) => ({ role, content }));
      const response = await sendBordieMessage({
        message: trimmed,
        context: requestContext,
        history: history.slice(0, -1),
      });

      await processAssistantResponse(response, { wasPreparing });
    } catch (error) {
      forceHideBordieActionOverlay();
      if (isAbortError(error)) {
        setChatError("Processamento cancelado.");
      } else {
        setChatError(error.message || "Não foi possível enviar a mensagem.");
        setChatMessages((current) => current.slice(0, -1));
        setChatInput(trimmed);
      }
    } finally {
      setChatLoading(false);
    }
  }

  if (!mounted || !bordieOpen) return null;

  const hasQuery = query.trim().length > 0;
  const showEmpty = hasQuery && flatActions.length === 0 && !isRunning;

  const floatingStyle =
    !isDocked && position
      ? { left: position.x, top: position.y, width: size.width, height: size.height }
      : !isDocked
        ? { width: size.width, height: size.height }
        : undefined;

  const panel = (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isDocked ? styles.panelDocked : styles.panelFloating} ${
        isResizing ? styles.panelResizing : ""
      } ${isDragging ? styles.panelDragging : ""} ${nearDockSnap ? styles.panelNearDock : ""}`}
      style={floatingStyle}
      role="dialog"
      aria-modal={!isDocked}
      aria-labelledby="bordie-command-title"
      onPointerMove={handlePanelPointerMove}
      onPointerUp={finishInteraction}
      onPointerCancel={finishInteraction}
    >
      {boardFullscreenDock && !boardFullscreenBordieHidden && (
        <button
          type="button"
          className={styles.boardEdgeToggle}
          onClick={() => setBoardFullscreenBordieHidden(true)}
          aria-label="Ocultar Bordie"
          title="Ocultar Bordie"
        >
          <ChevronRightIcon />
        </button>
      )}

      <header
        className={styles.header}
        onPointerDown={beginDrag}
      >
        <div className={styles.headerBrand}>
          <span className={styles.headerIcon}>
            <StarIcon />
          </span>
          <div>
            <h2 id="bordie-command-title" className={styles.title}>
              Bordie.ia
            </h2>
            <p className={styles.subtitle}>
              {isDocked ? "Sidebar · " : "Flutuante · "}
              {context.activeTabLabel}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {isDocked ? (
            <IconButton label="Desacoplar (flutuante)" size="sm" variant="ghost" onClick={floatBordie}>
              <FloatIcon />
            </IconButton>
          ) : (
            <IconButton label="Acoplar na sidebar direita" size="sm" variant="ghost" onClick={dockBordie}>
              <DockIcon />
            </IconButton>
          )}
          <IconButton label="Fechar Bordie.ia" size="sm" variant="ghost" onClick={closeBordie}>
            <CloseIcon />
          </IconButton>
        </div>
      </header>

      {isDocked && (
        <div className={styles.dockTabs} role="tablist" aria-label="Modo do Bordie">
          <button
            type="button"
            role="tab"
            aria-selected={dockPanel === BORDIE_DOCK_PANEL.CHAT}
            className={`${styles.dockTab} ${
              dockPanel === BORDIE_DOCK_PANEL.CHAT ? styles.dockTabActive : ""
            }`}
            onClick={() => {
              setDockPanelPref(BORDIE_DOCK_PANEL.CHAT);
              window.setTimeout(() => chatInputRef.current?.focus(), 0);
            }}
          >
            Chat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={dockPanel === BORDIE_DOCK_PANEL.ACTIONS}
            className={`${styles.dockTab} ${
              dockPanel === BORDIE_DOCK_PANEL.ACTIONS ? styles.dockTabActive : ""
            }`}
            onClick={() => {
              setDockPanelPref(BORDIE_DOCK_PANEL.ACTIONS);
              window.setTimeout(() => commandInputRef.current?.focus(), 0);
            }}
          >
            Ações
          </button>
        </div>
      )}

      <div className={styles.body}>
        {showActionsPane && (
        <section
          className={styles.commandPane}
          aria-label="Paleta de comandos"
          role={isDocked ? "tabpanel" : undefined}
        >
          <div className={styles.inputRow}>
            <span className={styles.inputIcon}>
              <StarIcon />
            </span>
            <input
              ref={commandInputRef}
              type="text"
              className={styles.input}
              placeholder="Executar ação…"
              value={query}
              disabled={isRunning}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleCommandKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className={styles.results}>
            {statusMessage && (
              <div
                className={`${styles.status} ${styles[STATUS_CLASS[statusMessage.type] || "statusInfo"]}`}
              >
                {statusMessage.text}
              </div>
            )}

            {!hasQuery && !statusMessage && (
              <p className={styles.hintBlock}>
                Ações rápidas com base na tela atual. Enter executa a selecionada.
              </p>
            )}

            {showEmpty && (
              <p className={styles.empty}>
                {isDocked
                  ? "Nenhuma ação — tente outro termo."
                  : "Nenhuma ação — tente outro termo ou use o chat →"}
              </p>
            )}

            {groupedActions.map(([category, actions]) => (
              <div key={category} className={styles.group}>
                <p className={styles.groupLabel}>{category}</p>
                {actions.map((action) => {
                  const index = flatActions.findIndex((item) => item.id === action.id);

                  return (
                    <button
                      key={action.id}
                      type="button"
                      className={`${styles.item} ${index === activeIndex ? styles.itemActive : ""}`}
                      disabled={isRunning}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => runAction(action)}
                    >
                      <div className={styles.itemMain}>
                        <p className={styles.itemTitle}>{action.label}</p>
                        {action.description && (
                          <p className={styles.itemMeta}>{action.description}</p>
                        )}
                      </div>
                      <span className={styles.itemType}>Ação</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <footer className={styles.commandFooter}>
            <span>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> · <Kbd>Enter</Kbd>
            </span>
            <span>
              <Kbd>{formatBinding(bindings["bordie.open"])}</Kbd>
            </span>
          </footer>
        </section>
        )}

        {!isDocked && showActionsPane && showChatPane && (
          <div className={styles.divider} aria-hidden="true" />
        )}

        {showChatPane && (
        <section
          className={styles.chatPane}
          aria-label="Conversa com Bordie"
          role={isDocked ? "tabpanel" : undefined}
        >
          {!isDocked && (
          <div className={styles.chatHeader}>
            <p className={styles.chatTitle}>Conversa</p>
            <p className={styles.chatHint}>
              {aiConfigured ? "Perguntas e orientações" : "Configure a IA em Configurações → IA"}
            </p>
          </div>
          )}

          {!aiConfigured && (
            <p className={styles.chatError}>
              IA não configurada — vá em Configurações → IA e salve um provedor ativo.
            </p>
          )}

          <div ref={chatListRef} className={styles.chatMessages}>
            {chatMessages.map((message) => {
              const isUser = message.role === "user";

              return (
                <article
                  key={message.id}
                  className={`${styles.chatMessage} ${
                    isUser ? styles.chatMessageUser : styles.chatMessageAssistant
                  }`}
                >
                  {!isUser && (
                    <span className={styles.chatAvatar} aria-hidden="true">
                      <StarIcon />
                    </span>
                  )}
                  <div className={styles.chatBubbleWrap}>
                    <p className={styles.chatLabel}>{isUser ? userName : "Bordie"}</p>
                    {isUser ? (
                      <p className={styles.chatBubble}>{message.content}</p>
                    ) : (
                      <>
                        {message.content ? (
                          <div className={styles.chatBubble}>{renderRichText(message.content)}</div>
                        ) : null}
                        {message.entities?.length ? (
                          <BordieEntityList entities={message.entities} onOpen={handleOpenEntity} />
                        ) : null}
                        {message.pendingAction ? (
                          <BordieActionConfirm
                            pending={message.pendingAction}
                            onConfirm={() =>
                              runWorkspaceActionNow(message.id, message.pendingAction.action)
                            }
                            onCancel={() => cancelPending(message.id)}
                            onOpen={handleOpenEntity}
                            onPickClient={(client) =>
                              pickClientForProject(message.id, message.pendingAction.action, client)
                            }
                            onCreateClient={(name) =>
                              createClientForProject(message.id, message.pendingAction.action, name)
                            }
                          />
                        ) : null}
                      </>
                    )}
                  </div>
                </article>
              );
            })}

            {chatLoading && (
              <article className={`${styles.chatMessage} ${styles.chatMessageAssistant}`}>
                <span className={styles.chatAvatar} aria-hidden="true">
                  <StarIcon />
                </span>
                <div className={styles.chatBubbleWrap}>
                  <p className={styles.chatLabel}>Bordie</p>
                  <p className={`${styles.chatBubble} ${styles.typing}`}>
                    <span />
                    <span />
                    <span />
                  </p>
                </div>
              </article>
            )}
          </div>

          <form className={styles.chatComposer} onSubmit={handleChatSubmit}>
            {chatError && <p className={styles.chatError}>{chatError}</p>}
            <div className={styles.chatComposerRow}>
              <textarea
                ref={chatInputRef}
                className={styles.chatInput}
                rows={2}
                placeholder={isDocked ? "Converse ou peça uma ação…" : "Converse com o Bordie…"}
                value={chatInput}
                disabled={chatLoading}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleChatSubmit(event);
                  }
                }}
              />
              <button
                type="submit"
                className={styles.chatSendBtn}
                disabled={chatLoading || !chatInput.trim()}
                aria-label="Enviar mensagem"
              >
                <SendIcon />
              </button>
            </div>
          </form>
        </section>
        )}
      </div>

      <footer className={styles.footer}>
        <span>
          {isDocked ? (
            <>
              <Kbd>Esc</Kbd> fechar · Chat e Ações · preferência salva
            </>
          ) : (
            <>
              <Kbd>Esc</Kbd> fechar · arraste à direita para acoplar · 4 cantos para redimensionar
            </>
          )}
        </span>
      </footer>

      {!isDocked && (
        <>
          <div
            className={`${styles.resizeHandle} ${styles.resizeNw}`}
            aria-hidden="true"
            onPointerDown={(event) => beginResize(event, "nw")}
          />
          <div
            className={`${styles.resizeHandle} ${styles.resizeNe}`}
            aria-hidden="true"
            onPointerDown={(event) => beginResize(event, "ne")}
          />
          <div
            className={`${styles.resizeHandle} ${styles.resizeSw}`}
            aria-hidden="true"
            onPointerDown={(event) => beginResize(event, "sw")}
          />
          <div
            className={`${styles.resizeHandle} ${styles.resizeSe}`}
            aria-hidden="true"
            onPointerDown={(event) => beginResize(event, "se")}
          />
        </>
      )}
    </div>
  );

  if (isDocked && boardFullscreenDock && boardFullscreenBordieHidden) {
    return createPortal(
      <button
        type="button"
        className={styles.boardRestoreTab}
        onClick={() => setBoardFullscreenBordieHidden(false)}
        aria-label="Mostrar Bordie"
        title="Mostrar Bordie"
      >
        <ChevronLeftIcon />
        <StarIcon />
      </button>,
      document.body
    );
  }

  if (isDocked && dockRoot) {
    return createPortal(panel, dockRoot);
  }

  if (isDocked) {
    return null;
  }

  return createPortal(
    <>
      {nearDockSnap && <div className={styles.dockSnapPreview} aria-hidden="true" />}
      <div className={styles.floatingLayer} role="presentation">
        {panel}
      </div>
    </>,
    document.body
  );
}
