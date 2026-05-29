export function maskCurrencyInput(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) return "";

  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrencyInput(masked) {
  if (masked == null || String(masked).trim() === "") return null;

  const digits = String(masked).replace(/\D/g, "");
  if (!digits) return null;

  return parseInt(digits, 10) / 100;
}

export function formatCurrencyInputFromNumber(value) {
  if (value == null || value === "") return "";

  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(num)) return "";

  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
