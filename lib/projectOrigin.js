export const PROJECT_ORIGINS = [
  { id: "own", label: "Próprio" },
  { id: "99freelas", label: "99Freelas" },
  { id: "workana", label: "Workana" },
];

export const PROJECT_ORIGIN_LABELS = {
  own: "Próprio",
  "99freelas": "99Freelas",
  workana: "Workana",
};

export function isMarketplaceOrigin(origin) {
  return origin === "99freelas" || origin === "workana";
}

export function getMarketplaceTabLabel(origin) {
  if (origin === "99freelas") return "99Freelas";
  if (origin === "workana") return "Workana";
  return null;
}
