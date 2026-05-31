"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/Button/Button";
import ExcalidrawCanvas from "@/components/ExcalidrawCanvas/ExcalidrawCanvas";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
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
  sceneToInitialData,
  serializeScene,
  setStoredBoardId,
} from "@/lib/excalidraw";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import styles from "./BoardView.module.css";

const SAVE_DEBOUNCE_MS = 1400;

function formatBoardLabel(board) {
  if (!board?.project?.name) return board?.name || "Board";
  return `${board.name} · ${board.project.name}`;
}

export default function BoardView() {
  const { theme } = useTheme();
  const [boards, setBoards] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [draftMode, setDraftMode] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [listFilter, setListFilter] = useState("all");
  const [initialData, setInitialData] = useState(sceneToInitialData(EMPTY_SCENE));
  const [canvasKey, setCanvasKey] = useState("loading");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle");

  const pendingScene = useRef(serializeScene([], EMPTY_SCENE.appState, {}));
  const saveTimer = useRef(null);
  const skipSave = useRef(true);

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
    setInitialData(sceneToInitialData(board.scene_data));
    setCanvasKey(board.id);
    setStoredBoardId(board.id);
    pendingScene.current = serializeScene(
      board.scene_data?.elements || [],
      board.scene_data?.appState || EMPTY_SCENE.appState,
      board.scene_data?.files || {}
    );
    skipSave.current = true;
    setSaveState("saved");
  }, []);

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
    };
  }, [initialize]);

  const persistScene = useCallback(
    async (scene) => {
      if (!scene || draftMode || !activeBoard?.id) return;

      setSaveState("saving");
      try {
        const updated = await updateBoard(activeBoard.id, { scene_data: scene });
        setActiveBoard(updated);
        setBoards((current) =>
          current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        );
        setSaveState("saved");
      } catch {
        setSaveState("error");
        showErrorToast("Erro ao salvar o board");
      }
    },
    [activeBoard?.id, draftMode]
  );

  function handleSceneChange(elements, appState, files) {
    pendingScene.current = serializeScene(elements, appState, files);

    if (skipSave.current) {
      skipSave.current = false;
      return;
    }

    if (draftMode) {
      setSaveState("idle");
      return;
    }

    setSaveState("idle");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistScene(pendingScene.current);
    }, SAVE_DEBOUNCE_MS);
  }

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
    setInitialData(sceneToInitialData(EMPTY_SCENE));
    setCanvasKey(`draft-${Date.now()}`);
    pendingScene.current = serializeScene([], EMPTY_SCENE.appState, {});
    skipSave.current = true;
    setSaveState("idle");
  }

  async function handleBoardSelect(boardId) {
    if (!boardId) return;
    if (draftMode && !window.confirm("Descartar o board novo e abrir outro?")) return;

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

  const saveLabel = useMemo(() => {
    if (draftMode) return "Novo board (não salvo)";
    if (saveState === "saving") return "Salvando...";
    if (saveState === "saved") return "Salvo";
    if (saveState === "error") return "Erro ao salvar";
    if (saveState === "idle") return "Alterações pendentes";
    return "Pronto";
  }, [draftMode, saveState]);

  if (loading) {
    return <p className={styles.loading}>Carregando board...</p>;
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
              {filteredBoards.map((board) => (
                <option key={board.id} value={board.id}>
                  {formatBoardLabel(board)}
                  {board.is_default ? " (principal)" : ""}
                </option>
              ))}
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

        <div className={styles.toolbarActions}>
          <span
            className={`${styles.saveStatus} ${
              saveState === "saved"
                ? styles.saveStatusOk
                : saveState === "error"
                  ? styles.saveStatusError
                  : ""
            }`}
          >
            {saveLabel}
          </span>
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
        </div>
      </div>

      <div className={styles.canvasShell}>
        <ExcalidrawCanvas
          boardKey={canvasKey}
          initialData={initialData}
          theme={excalidrawTheme}
          onSceneChange={handleSceneChange}
        />
      </div>
    </div>
  );
}
