export function formatRelativeTime(dateInput, locale = "pt-BR") {
  if (!dateInput) return "";

  let date;
  if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput?.utc) {
    date = new Date(dateInput.utc);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return "";
  }

  if (Number.isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return "Agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHour < 24) return `${diffHour} h atrás`;
  if (diffDay === 1) return "Ontem";
  if (diffDay < 7) return `${diffDay} dias atrás`;

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return `Hoje, ${date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function getDateFromApi(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.utc) return value.utc;
  if (value.local) return value.local;
  return null;
}
