import {
  CREDENTIAL_KINDS,
  parseCredentialDetail,
  parseGithubDetail,
} from "./projectDetailConfig";

const CRED_KIND_LABEL = Object.fromEntries(
  CREDENTIAL_KINDS.map((k) => [k.id, k.label])
);

const CATEGORY_LABEL = {
  credentials: "Credencial",
  github: "GitHub",
  links: "Link",
  scope: "Escopo",
  contract: "Contrato",
  deployment: "Deploy",
  environment: "Ambiente",
  documentation: "Documentação",
  notes: "Notas",
  custom: "Outro",
};

/** Divide a busca em escopo (antes do ":") e filtro (depois). */
export function parseSearchQuery(query) {
  const raw = query ?? "";
  const idx = raw.indexOf(":");
  if (idx === -1) {
    return { isScoped: false, scope: "", filter: "" };
  }
  return {
    isScoped: true,
    scope: raw.slice(0, idx).trim(),
    filter: raw.slice(idx + 1).trim(),
  };
}

export function safeParseJson(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

/** Transforma os detalhes agrupados do projeto numa lista pesquisável. */
export function buildProjectDataItems(grouped = {}) {
  const items = [];

  for (const [category, details] of Object.entries(grouped)) {
    if (!Array.isArray(details)) continue;

    for (const detail of details) {
      if (category === "credentials") {
        const cred = parseCredentialDetail(detail);
        const kindLabel = CRED_KIND_LABEL[cred.kind] || cred.kind;
        items.push({
          id: detail.id,
          type: "credential",
          category,
          label: cred.label || detail.label,
          sublabel: kindLabel,
          searchText: [cred.label, detail.label, cred.kind, kindLabel, cred.host, cred.username]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
          detail,
        });
      } else if (category === "github") {
        const repo = parseGithubDetail(detail);
        items.push({
          id: detail.id,
          type: "github",
          category,
          label: repo.label || detail.label,
          sublabel: "GitHub",
          searchText: [repo.label, detail.label, repo.url, repo.role, "github", "repositorio", "repo"]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
          detail,
        });
      } else {
        const catLabel = CATEGORY_LABEL[category] || category;
        items.push({
          id: detail.id,
          type: category === "links" ? "link" : "detail",
          category,
          label: detail.label,
          sublabel: catLabel,
          searchText: [detail.label, category, catLabel].filter(Boolean).join(" ").toLowerCase(),
          detail,
        });
      }
    }
  }

  return items;
}

export function filterDataItems(items, filter) {
  const term = (filter || "").trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) => item.searchText.includes(term));
}

/**
 * Campos copiáveis de um item já com o valor disponível.
 * Para credenciais, `revealed` é o detalhe revelado (com a senha).
 */
export function buildCopyFields(item, revealed = null) {
  if (item.type === "credential") {
    const source = revealed?.value_text ?? revealed?.value ?? item.detail?.value;
    const data = safeParseJson(source);
    return [
      { label: "Host / URL", value: data.host || data.url || "" },
      { label: "Usuário", value: data.username || data.email || "" },
      { label: "Senha", value: data.password || "" },
      { label: "Porta", value: data.port || "" },
      { label: "Notas", value: data.notes || "" },
    ].filter((f) => String(f.value).trim() !== "");
  }

  if (item.type === "github") {
    const repo = parseGithubDetail(item.detail);
    return [
      { label: "Repositório", value: repo.url, isLink: true },
      { label: "Branch", value: repo.branch },
      { label: "Notas", value: repo.notes },
    ].filter((f) => String(f.value).trim() !== "");
  }

  if (item.type === "link") {
    const json = safeParseJson(item.detail?.value_json ?? item.detail?.value);
    const url =
      json.url || item.detail?.value_text || (typeof item.detail?.value === "string" ? item.detail.value : "");
    return [{ label: item.label, value: url, isLink: /^https?:\/\//i.test(url) }].filter(
      (f) => String(f.value).trim() !== ""
    );
  }

  const text = item.detail?.value_text ?? item.detail?.value ?? "";
  return [{ label: item.label, value: typeof text === "string" ? text : JSON.stringify(text) }].filter(
    (f) => String(f.value).trim() !== ""
  );
}
