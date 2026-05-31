"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import styles from "./ExcalidrawCanvas.module.css";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Carregando canvas...</div>,
  }
);

export default function ExcalidrawCanvas({
  boardKey,
  initialData,
  theme = "light",
  onSceneChange,
}) {
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = false;
    const timer = window.setTimeout(() => {
      readyRef.current = true;
    }, 400);

    return () => window.clearTimeout(timer);
  }, [boardKey]);

  return (
    <div className={styles.root}>
      <Excalidraw
        key={boardKey}
        theme={theme}
        initialData={initialData}
        onChange={(elements, appState, files) => {
          if (!readyRef.current) return;
          onSceneChange?.(elements, appState, files);
        }}
      />
    </div>
  );
}
