"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/Button/Button";
import ExcalidrawCanvas from "@/components/ExcalidrawCanvas/ExcalidrawCanvas";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import { useDashboardTab } from "@/context/DashboardTabContext";
import {
  createBoard,
  deleteBoard,
  getBoard,
  getDefaultBoard,
  listBoards,
  updateBoard,
} from "@/api/boards";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import {
  EMPTY_SCENE,
  getStoredBoardId,
  normalizeScene,
  serializeScene,
  setStoredBoardId,
} from "@/lib/excalidraw";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import styles from "./BoardView.module.css";

const SAVE_DEBOUNCE_MS = 900;

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
      <path
        d="M2.5 6V3.5A1 1 0 0 1 3.5 2.5H6M10 2.5h2.5A1 1 0 0 1 13.5 3.5V6M13.5 10v2.5a1 1 0 0 1-1 1H10M6 13.5H3.5a1 1 0 0 1-1-1V10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
      <path
        d="M6 2.5H3.5A1 1 0 0 0 2.5 3.5V6M10 2.5h2.5A1 1 0 0 1 13.5 3.5V6M2.5 10v2.5A1 1 0 0 0 3.5 13.5H6M13.5 10v2.5a1 1 0 0 1-1 1H10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatBoardLabel(board) {
  if (!board?.project?.name) return board?.name || "Board";
  return `${board.name} · ${board.project.name}`;
}

export default function BoardView() {
  const { theme } = useTheme();
  const { activeTab } = useDashboardTab();
  const [boards, setBoards] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [draftMode, setDraftMode] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [listFilter, setListFilter] = useState("all");
  const [scene, setScene] = useState(() => normalizeScene(EMPTY_SCENE, "light"));
  const [canvasKey, setCanvasKey] = useState("loading");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pendingScene = useRef(serializeScene([], EMPTY_SCENE.appState, {}));
  const saveTimer = useRef(null);
  const isHydratingRef = useRef(true);
  const persistSceneRef = useRef(null);
  const activeBoardRef = useRef(null);
  const draftModeRef = useRef(false);
  const hydrateTimerRef = useRef(null);

  const excalidrawTheme = theme === "dark" ? "dark" : "light";

  const filteredBoards = useMemo(() => {
    if (listFilter === "workspace") {
      return boards.filter((board) => !board.project_id);
    }
    if (listFilter !== "all" && listFilter !== "workspace") {
      return boards.filter((board) => board.project_id === listFilter);
    }
    return boards;
  }, [boards, listFilter]);

  const loadBoards = useCallback(async () => {
    const [boardsData, projectsData] = await Promise.all([
      listBoards(),
      listProjects({ limit: 200 }),
    ]);
    setBoards(normalizeListResponse(boardsData));
    setProjects(normalizeListResponse(projectsData));
  }, []);

  const beginSceneHydration = useCallback(() => {
    isHydratingRef.current = true;
    if (hydrateTimerRef.current) window.clearTimeout(hydrateTimerRef.current);
    hydrateTimerRef.current = window.setTimeout(() => {
      isHydratingRef.current = false;
      hydrateTimerRef.current = null;
    }, 450);
  }, []);

  const selectBoard = useCallback((board) => {
    if (!board) return;

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    setDraftMode(false);
    setActiveBoard(board);
    setBoardName(board.name || "");
    setProjectId(board.project_id || "");
    const normalized = normalizeScene(board.scene_data, excalidrawTheme);
    setScene(normalized);
    setCanvasKey(board.id);
    setStoredBoardId(board.id);
    pendingScene.current = normalized;
    beginSceneHydration();
    setSaveState("saved");
  }, [beginSceneHydration, excalidrawTheme]);

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      await loadBoards();

      const storedId = getStoredBoardId();
      let board = null;

      if (storedId) {
        try {
          board = await getBoard(storedId);
        } catch {
          board = null;
        }
      }

      if (!board) {
        board = await getDefaultBoard();
      }

      selectBoard(board);
    } catch {
      showErrorToast("Não foi possível carregar o board");
    } finally {
      setLoading(false);
    }
  }, [loadBoards, selectBoard]);

  useEffect(() => {
    initialize();
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      if (hydrateTimerRef.current) window.clearTimeout(hydrateTimerRef.current);
    };
  }, [initialize]);

  const persistScene = useCallback(
    async (nextScene, { silent = false } = {}) => {
      if (!nextScene || draftModeRef.current || !activeBoardRef.current?.id) return;

      setSaveState("saving");
      try {
        const updated = await updateBoard(activeBoardRef.current.id, {
          scene_data: nextScene,
        });
        setActiveBoard(updated);
        activeBoardRef.current = updated;
        setBoards((current) =>
          current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        );
        setSaveState("saved");
      } catch {
        setSaveState("error");
        if (!silent) showErrorToast("Erro ao salvar o board");
      }
    },
    []
  );

  persistSceneRef.current = persistScene;

  useEffect(() => {
    activeBoardRef.current = activeBoard;
  }, [activeBoard]);

  useEffect(() => {
    draftModeRef.current = draftMode;
  }, [draftMode]);

  const flushPendingSave = useCallback(async () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    if (draftModeRef.current || !activeBoardRef.current?.id || isHydratingRef.current) return;

    await persistSceneRef.current?.(pendingScene.current, { silent: true });
  }, []);

  const scheduleAutoSave = useCallback(() => {
    if (draftModeRef.current || !activeBoardRef.current?.id) {
      setSaveState("idle");
      return;
    }

    setSaveState("pending");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistSceneRef.current?.(pendingScene.current);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  function handleSceneChange(elements, appState, files) {
    pendingScene.current = serializeScene(elements, appState, files, excalidrawTheme);

    if (isHydratingRef.current || draftMode) {
      if (draftMode) setSaveState("idle");
      return;
    }

    scheduleAutoSave();
  }

  useEffect(() => {
    if (activeTab !== "board") {
      flushPendingSave();
    }
  }, [activeTab, flushPendingSave]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushPendingSave();
      }
    }

    function handleBeforeUnload() {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    }

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushPendingSave();
    };
  }, [flushPendingSave]);

  useEffect(() => {
    if (!isFullscreen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsFullscreen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  async function handleSaveDraft() {
    const trimmedName = boardName.trim();
    if (!trimmedName) {
      showErrorToast("Informe um nome para o board");
      return;
    }

    setSaveState("saving");
    try {
      const created = await createBoard({
        name: trimmedName,
        project_id: projectId || null,
        scene_data: pendingScene.current,
      });
      await loadBoards();
      selectBoard(created);
      showSuccessToast("Board criado");
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      showErrorToast(err.message || "Erro ao criar board");
    }
  }

  function handleNewBoard() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    setDraftMode(true);
    setActiveBoard(null);
    setBoardName("Novo board");
    setProjectId("");
    const emptyScene = normalizeScene(EMPTY_SCENE, excalidrawTheme);
    setScene(emptyScene);
    setCanvasKey(`draft-${Date.now()}`);
    pendingScene.current = emptyScene;
    beginSceneHydration();
    setSaveState("idle");
  }

  async function handleBoardSelect(boardId) {
    if (!boardId) return;
    if (draftMode && !window.confirm("Descartar o board novo e abrir outro?")) return;

    await flushPendingSave();

    try {
      const board = await getBoard(boardId);
      selectBoard(board);
    } catch {
      showErrorToast("Não foi possível abrir o board");
    }
  }

  async function handleProjectChange(nextProjectId) {
    setProjectId(nextProjectId);

    if (draftMode || !activeBoard?.id) return;

    try {
      const updated = await updateBoard(activeBoard.id, {
        project_id: nextProjectId || null,
      });
      setActiveBoard(updated);
      await loadBoards();
      showSuccessToast(nextProjectId ? "Board vinculado ao projeto" : "Board desvinculado");
    } catch {
      showErrorToast("Não foi possível atualizar o vínculo");
      setProjectId(activeBoard.project_id || "");
    }
  }

  async function handleRenameBlur() {
    if (draftMode || !activeBoard?.id) return;

    const trimmed = boardName.trim();
    if (!trimmed || trimmed === activeBoard.name) return;

    try {
      const updated = await updateBoard(activeBoard.id, { name: trimmed });
      setActiveBoard(updated);
      await loadBoards();
    } catch {
      showErrorToast("Não foi possível renomear o board");
      setBoardName(activeBoard.name);
    }
  }

  async function handleDeleteBoard() {
    if (!activeBoard?.id || activeBoard.is_default) return;
    if (!window.confirm(`Excluir o board "${activeBoard.name}"?`)) return;

    try {
      await deleteBoard(activeBoard.id);
      showSuccessToast("Board excluído");
      const defaultBoard = await getDefaultBoard();
      await loadBoards();
      selectBoard(defaultBoard);
    } catch (err) {
      showErrorToast(err.message || "Não foi possível excluir");
    }
  }

  const boardSelectOptions = useMemo(
    () =>
      boards.map((board) => (
        <option key={board.id} value={board.id}>
          {formatBoardLabel(board)}
          {board.is_default ? " (principal)" : ""}
        </option>
      )),
    [boards]
  );

  const filteredBoardSelectOptions = useMemo(
    () =>
      filteredBoards.map((board) => (
        <option key={board.id} value={board.id}>
          {formatBoardLabel(board)}
          {board.is_default ? " (principal)" : ""}
        </option>
      )),
    [filteredBoards]
  );

  const activeProjectLabel = projectId
    ? projects.find((item) => item.id === projectId)?.name || "Projeto"
    : "Workspace";

  const saveLabel = useMemo(() => {
    if (draftMode) return "Rascunho — salve para persistir";
    if (saveState === "saving") return "Salvando...";
    if (saveState === "saved") return "Salvo automaticamente";
    if (saveState === "error") return "Erro ao salvar";
    if (saveState === "pending") return "Salvando em breve...";
    return "Pronto";
  }, [draftMode, saveState]);

  const isBoardVisible = activeTab === "board" || isFullscreen;

  const canvasBlock = (
    <div className={`${styles.canvasShell} ${isFullscreen ? styles.canvasShellFullscreen : ""}`}>
      {isBoardVisible ? (
        <ExcalidrawCanvas
          sceneKey={canvasKey}
          scene={scene}
          theme={excalidrawTheme}
          onSceneChange={handleSceneChange}
        />
      ) : (
        <div className={styles.canvasPlaceholder} aria-hidden="true" />
      )}
    </div>
  );

  const toolbarActions = (
    <>
      <span
        className={`${styles.saveStatus} ${
          saveState === "saved"
            ? styles.saveStatusOk
            : saveState === "error"
              ? styles.saveStatusError
              : saveState === "pending" || saveState === "saving"
                ? styles.saveStatusPending
                : ""
        }`}
      >
        {saveLabel}
      </span>
      <Button
        variant="secondary"
        size="sm"
        icon={isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        onClick={() => setIsFullscreen((current) => !current)}
      >
        {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      </Button>
      <Button variant="secondary" size="sm" onClick={handleNewBoard}>
        Novo board
      </Button>
      {draftMode ? (
        <Button variant="primary" size="sm" onClick={handleSaveDraft}>
          Salvar board
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => persistScene(pendingScene.current)}
          disabled={saveState === "saving"}
        >
          Salvar agora
        </Button>
      )}
      {!draftMode && activeBoard && !activeBoard.is_default && (
        <Button variant="secondary" size="sm" onClick={handleDeleteBoard}>
          Excluir
        </Button>
      )}
    </>
  );

  if (loading) {
    return <p className={styles.loading}>Carregando board...</p>;
  }

  if (isFullscreen) {
    return (
      <div className={styles.fullscreenOverlay} data-tour="board-view">
        <header className={styles.fullscreenBar}>
          <div className={styles.fullscreenBarMain}>
            <div className={styles.fullscreenBoardPicker}>
              <select
                className={styles.fullscreenBoardSelect}
                value={draftMode ? "" : activeBoard?.id || ""}
                onChange={(event) => handleBoardSelect(event.target.value)}
                aria-label="Trocar board"
              >
                {draftMode && <option value="">Novo board (rascunho)</option>}
                {boardSelectOptions}
              </select>
            </div>
            <p className={styles.fullscreenMeta}>{activeProjectLabel}</p>
          </div>
          <div className={styles.toolbarActions}>{toolbarActions}</div>
        </header>
        {canvasBlock}
      </div>
    );
  }

  return (
    <div className={styles.wrap} data-tour="board-view">
      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="board-select">
              Board
            </label>
            <select
              id="board-select"
              className={styles.select}
              value={draftMode ? "" : activeBoard?.id || ""}
              onChange={(event) => handleBoardSelect(event.target.value)}
            >
              {draftMode && <option value="">Novo board (rascunho)</option>}
              {filteredBoardSelectOptions}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="board-name">
              Nome
            </label>
            <input
              id="board-name"
              className={styles.input}
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
              onBlur={handleRenameBlur}
              placeholder="Nome do board"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="board-project">
              Projeto
            </label>
            <select
              id="board-project"
              className={styles.select}
              value={projectId}
              onChange={(event) => handleProjectChange(event.target.value)}
            >
              <option value="">Workspace (sem projeto)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="board-filter">
              Filtrar lista
            </label>
            <select
              id="board-filter"
              className={styles.select}
              value={listFilter}
              onChange={(event) => setListFilter(event.target.value)}
            >
              <option value="all">Todos os boards</option>
              <option value="workspace">Somente workspace</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.toolbarActions}>{toolbarActions}</div>
      </div>

      {canvasBlock}
    </div>
  );
}
