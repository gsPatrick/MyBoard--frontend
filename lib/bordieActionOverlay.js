export function setBordieActionOverlay(active, label = "") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("myboard:bordie-action-overlay", {
      detail: { active: Boolean(active), label: label || "" },
    })
  );
}

export async function withBordieActionOverlay(fn, label = "") {
  setBordieActionOverlay(true, label);
  const startedAt = Date.now();
  try {
    return await fn();
  } finally {
    const elapsed = Date.now() - startedAt;
    const minVisible = 900;
    if (elapsed < minVisible) {
      await new Promise((resolve) => window.setTimeout(resolve, minVisible - elapsed));
    }
    setBordieActionOverlay(false);
  }
}
