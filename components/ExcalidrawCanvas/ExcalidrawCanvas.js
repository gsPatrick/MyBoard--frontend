"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import "@excalidraw/excalidraw/index.css";
import styles from "./ExcalidrawCanvas.module.css";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Carregando editor...</div>,
  }
);

export default function ExcalidrawCanvas({
  sceneKey,
  scene,
  theme = "light",
  onSceneChange,
}) {
  const apiRef = useRef(null);
  const skipChangeRef = useRef(true);
  const loadedKeyRef = useRef(null);

  const applyScene = useCallback(async (targetScene) => {
    const api = apiRef.current;
    if (!api || !targetScene) return;

    const { CaptureUpdateAction } = await import("@excalidraw/excalidraw");

    skipChangeRef.current = true;

    const files = targetScene.files ? Object.values(targetScene.files) : [];
    if (files.length > 0) {
      api.addFiles(files);
    }

    api.updateScene({
      elements: targetScene.elements || [],
      appState: targetScene.appState || {},
      captureUpdate: CaptureUpdateAction.NEVER,
    });

    api.history.clear();
    api.scrollToContent(undefined, { fitToContent: true, animate: false });

    window.setTimeout(() => {
      skipChangeRef.current = false;
    }, 350);
  }, []);

  useEffect(() => {
    if (!apiRef.current) return;
    if (loadedKeyRef.current === sceneKey) return;
    loadedKeyRef.current = sceneKey;
    applyScene(scene);
  }, [sceneKey, scene, applyScene]);

  return (
    <div className={styles.host}>
      <Excalidraw
        theme={theme}
        langCode="pt-BR"
        gridModeEnabled
        detectScroll={false}
        autoFocus
        excalidrawAPI={(api) => {
          apiRef.current = api;
          if (loadedKeyRef.current !== sceneKey) {
            loadedKeyRef.current = sceneKey;
            applyScene(scene);
          }
        }}
        onChange={(elements, appState, files) => {
          if (skipChangeRef.current) return;
          onSceneChange?.(elements, appState, files);
        }}
      />
    </div>
  );
}
