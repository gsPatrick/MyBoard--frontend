// Preferência de importação por IA: confirmar no modal (padrão) ou aplicar automático.
const KEY = "myboard_ingestion_auto";

export function getIngestionAuto() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setIngestionAuto(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}
