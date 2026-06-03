export const DEFAULT_CLIPROXY_URL =
  "https://geral-cli-antigravity-patrick.r954jc.easypanel.host";

const MODEL_GROUP_RULES = [
  { id: "gemini", label: "Gemini", test: (id) => /^gemini/i.test(id) || /^tab_/i.test(id) },
  { id: "claude", label: "Claude", test: (id) => /^claude/i.test(id) },
  { id: "gpt", label: "GPT / OSS", test: (id) => /^gpt/i.test(id) },
];

export function inferProxyModelGroup(modelId) {
  const id = String(modelId || "");
  const match = MODEL_GROUP_RULES.find((rule) => rule.test(id));
  return match?.id || "other";
}

export function groupProxyModels(models = []) {
  const buckets = new Map(MODEL_GROUP_RULES.map((rule) => [rule.id, { ...rule, models: [] }]));
  buckets.set("other", { id: "other", label: "Outros", models: [] });

  for (const model of models) {
    const groupId = inferProxyModelGroup(model.id);
    buckets.get(groupId)?.models.push(model);
  }

  return [...buckets.values()].filter((group) => group.models.length > 0);
}

export function pickDefaultProxyModel(models = [], preferredId = "gemini-2.5-flash") {
  if (!models.length) return preferredId;
  const exact = models.find((item) => item.id === preferredId);
  if (exact) return exact.id;
  const flash = models.find((item) => /gemini-2\.5-flash$/i.test(item.id));
  if (flash) return flash.id;
  return models[0].id;
}
