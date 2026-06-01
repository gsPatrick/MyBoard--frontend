"use client";

import { useCallback, useState } from "react";
import Button from "@/components/Button/Button";
import BordieActionOverlay from "@/components/BordieActionOverlay/BordieActionOverlay";
import { setBordieActionOverlay, withBordieActionOverlay } from "@/lib/bordieActionOverlay";
import styles from "./page.module.css";

export default function AnimacaoPage() {
  const [running, setRunning] = useState(false);

  const runDemo = useCallback(async (label, duration = 2800) => {
    setRunning(true);
    setBordieActionOverlay(true, label);
    await new Promise((resolve) => window.setTimeout(resolve, duration));
    setBordieActionOverlay(false);
    setRunning(false);
  }, []);

  const runWrappedDemo = useCallback(async () => {
    setRunning(true);
    await withBordieActionOverlay(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 2400));
    }, "Bordie organizando o board…");
    setRunning(false);
  }, []);

  return (
    <>
      <BordieActionOverlay />

      <div className={styles.page}>
        <div className={styles.mockApp}>
          <aside className={styles.mockSidebar}>
            <span>Sidebar</span>
          </aside>

          <main className={styles.mockMain}>
            <header className={styles.mockHeader}>
              <strong>Preview — animação de ação</strong>
              <span>Esta área recebe o brilho; o Bordie ficaria acima (z-index maior).</span>
            </header>

            <section className={styles.mockCanvas}>
              <h1>Canvas / Dashboard</h1>
              <p>
                Simula o efeito Atlas: brilho suave na tela inteira enquanto o Bordie executa uma
                ação no sistema.
              </p>

              <div className={styles.actions}>
                <Button
                  variant="primary"
                  disabled={running}
                  onClick={() => runDemo("Bordie atualizando o board…", 3200)}
                >
                  Simular ação (3s)
                </Button>
                <Button
                  variant="secondary"
                  disabled={running}
                  onClick={() => runDemo("Enviando contrato via WhatsApp…", 2600)}
                >
                  Simular envio WhatsApp
                </Button>
                <Button variant="secondary" disabled={running} onClick={runWrappedDemo}>
                  Simular com helper (min 520ms)
                </Button>
              </div>
            </section>
          </main>

          <aside className={styles.mockBordie} aria-label="Área do Bordie (sem overlay)">
            <p>Bordie</p>
            <small>Fica acima do overlay — sem brilho.</small>
          </aside>
        </div>
      </div>
    </>
  );
}
