import { buildBordieContext } from "@/lib/bordieActions";

export function buildBoardSnapshotFromScene(activeBoard, sceneData) {
  if (!activeBoard?.id || !sceneData) return null;

  const visible = (sceneData.elements || []).filter((el) => !el.isDeleted);
  const typeCounts = visible.reduce((acc, el) => {
    const type = el.type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    id: activeBoard.id,
    name: activeBoard.name,
    scene_data: sceneData,
    summary: {
      element_count: visible.length,
      labels: visible
        .map((el) => el.text || el.originalText || el.name || el.type)
        .filter(Boolean)
        .slice(0, 40),
      types: [...new Set(visible.map((el) => el.type).filter(Boolean))],
      type_counts: typeCounts,
      has_content: visible.length > 0,
    },
  };
}

export function captureBoardContextForBordie(timeoutMs = 120) {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("myboard:board-context-snapshot", onSnapshot);
      resolve(null);
    }, timeoutMs);

    function onSnapshot(event) {
      window.clearTimeout(timer);
      window.removeEventListener("myboard:board-context-snapshot", onSnapshot);
      resolve(event.detail || null);
    }

    window.addEventListener("myboard:board-context-snapshot", onSnapshot);
    window.dispatchEvent(new CustomEvent("myboard:request-board-context"));
  });
}

export async function buildBordieContextWithFreshBoard(baseParams) {
  if (baseParams.activeTab !== "board") {
    return buildBordieContext(baseParams);
  }

  const fresh = await captureBoardContextForBordie();
  return buildBordieContext({
    ...baseParams,
    boardContext: fresh || baseParams.boardContext,
  });
}
