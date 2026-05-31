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
  const mountedRef = useRef(false);
  const skipTimerRef = useRef(null);
  const applyTokenRef = useRef(0);

  const clearSkipTimer = useCallback(() => {
    if (skipTimerRef.current) {
      window.clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
  }, []);

  const applyScene = useCallback(
    async (targetScene, key = sceneKey) => {
      const api = apiRef.current;
      if (!api || !targetScene || !mountedRef.current) return;

      const token = applyTokenRef.current + 1;
      applyTokenRef.current = token;

      const { CaptureUpdateAction } = await import("@excalidraw/excalidraw");

      if (!mountedRef.current || applyTokenRef.current !== token || apiRef.current !== api) {
        return;
      }

      skipChangeRef.current = true;
      clearSkipTimer();

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

      loadedKeyRef.current = key;

      skipTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          skipChangeRef.current = false;
        }
      }, 350);
    },
    [clearSkipTimer, sceneKey]
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      applyTokenRef.current += 1;
      clearSkipTimer();
      apiRef.current = null;
    };
  }, [clearSkipTimer]);

  useEffect(() => {
    if (!apiRef.current || loadedKeyRef.current === sceneKey) return;
    applyScene(scene, sceneKey);
  }, [sceneKey, scene, applyScene]);

  return (
    <div className={styles.host}>
      <Excalidraw
        theme={theme}
        langCode="pt-BR"
        gridModeEnabled
        detectScroll={false}
        autoFocus={false}
        excalidrawAPI={(api) => {
          apiRef.current = api;

          if (loadedKeyRef.current === sceneKey) return;

          window.requestAnimationFrame(() => {
            if (!mountedRef.current || apiRef.current !== api) return;
            applyScene(scene, sceneKey);
          });
        }}
        onChange={(elements, appState, files) => {
          if (skipChangeRef.current) return;
          onSceneChange?.(elements, appState, files);
        }}
      />
    </div>
  );
}
