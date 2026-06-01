import { FINANCIAL_ENTRY_COLORS } from "./financialLabels";

export function parseAmount(value) {
  const amount = parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

export function sumEntryAmounts(entries = []) {
  return entries.reduce((sum, entry) => sum + parseAmount(entry.amount), 0);
}

export function groupByEntryType(entries = []) {
  const map = {};
  for (const entry of entries) {
    const type = entry.entry_type || "outro";
    if (!map[type]) map[type] = 0;
    map[type] += parseAmount(entry.amount);
  }
  return map;
}

export function groupByMonth(entries = []) {
  const map = {};
  for (const entry of entries) {
    const key = (entry.entry_date || "").slice(0, 7);
    if (!key) continue;
    if (!map[key]) map[key] = 0;
    map[key] += parseAmount(entry.amount);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}

export function buildTypeChartSegments(byType) {
  const total = Object.values(byType).reduce((s, v) => s + v, 0);
  if (total <= 0) return [];

  let cursor = 0;
  return Object.entries(byType)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => {
      const percent = (value / total) * 100;
      const start = cursor;
      cursor += percent;
      return {
        type,
        value,
        percent,
        start,
        end: cursor,
        color: FINANCIAL_ENTRY_COLORS[type] || FINANCIAL_ENTRY_COLORS.outro,
      };
    });
}

export function conicGradientFromSegments(segments) {
  if (!segments.length) return "conic-gradient(var(--surface-muted) 0deg 360deg)";
  const stops = segments.map(
    (seg) => `${seg.color} ${seg.start}% ${seg.end}%`
  );
  return `conic-gradient(${stops.join(", ")})`;
}

export function buildReceivedByProjectId(entries = []) {
  const map = {};

  for (const entry of entries) {
    const projectId = entry.project_id || entry.project?.id;
    if (!projectId) continue;
    map[projectId] = (map[projectId] || 0) + parseAmount(entry.amount);
  }

  return map;
}

export function aggregateByProject(entries = [], projects = []) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const totals = {};

  for (const entry of entries) {
    const projectId = entry.project_id || entry.project?.id;
    if (!projectId) continue;
    if (!totals[projectId]) {
      totals[projectId] = {
        projectId,
        project: entry.project || projectMap.get(projectId),
        received: 0,
        entryCount: 0,
      };
    }
    totals[projectId].received += parseAmount(entry.amount);
    totals[projectId].entryCount += 1;
  }

  return Object.values(totals).sort((a, b) => b.received - a.received);
}

export function groupByMonthAndType(entries = []) {
  const data = {};
  const types = new Set();

  for (const entry of entries) {
    const month = (entry.entry_date || "").slice(0, 7);
    if (!month) continue;
    const type = entry.entry_type || "outro";
    types.add(type);
    if (!data[month]) data[month] = {};
    data[month][type] = (data[month][type] || 0) + parseAmount(entry.amount);
  }

  const months = Object.keys(data).sort();
  return {
    months,
    types: [...types].sort(),
    data,
  };
}

export function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function addMonthsToYearMonth(ym, delta) {
  const [year, month] = ym.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function listMonthsBetween(startYm, endYm) {
  const months = [];
  let current = startYm;
  while (current <= endYm) {
    months.push(current);
    current = addMonthsToYearMonth(current, 1);
  }
  return months;
}

/** Meses contínuos: passado sem lançamento (vazio), com dados, e futuro (zerado previsto). */
export function buildPanoramaTimeline(monthType, options = {}) {
  const futureMonths = options.futureMonths ?? 3;
  const lookbackMonths = options.lookbackMonths ?? 11;
  const currentYm = getCurrentYearMonth();
  const entryMonths = monthType.months;

  const windowStart = addMonthsToYearMonth(currentYm, -lookbackMonths);
  let startYm = windowStart;
  if (entryMonths.length > 0 && entryMonths[0] < startYm) {
    startYm = entryMonths[0];
  }

  const endYm = addMonthsToYearMonth(currentYm, futureMonths);
  const allMonths = listMonthsBetween(startYm, endYm);

  return allMonths.map((month) => {
    const monthData = monthType.data[month] || {};
    const total = Object.values(monthData).reduce((sum, value) => sum + value, 0);
    const isFuture = month > currentYm;

    let slot;
    if (isFuture) {
      slot = "future";
    } else if (total > 0) {
      slot = "data";
    } else {
      slot = "past-empty";
    }

    return { month, monthData, total, slot };
  });
}

export function buildCumulativeByMonth(byMonth = []) {
  let cumulative = 0;
  return byMonth.map((item) => {
    cumulative += item.total;
    return { ...item, cumulative };
  });
}

export function aggregateByClient(entries = []) {
  const totals = {};

  for (const entry of entries) {
    const client = entry.project?.client;
    if (!client?.id) continue;
    if (!totals[client.id]) {
      totals[client.id] = { client, received: 0, entryCount: 0, projectIds: new Set() };
    }
    totals[client.id].received += parseAmount(entry.amount);
    totals[client.id].entryCount += 1;
    if (entry.project?.id) totals[client.id].projectIds.add(entry.project.id);
  }

  return Object.values(totals)
    .map((row) => ({
      ...row,
      projectCount: row.projectIds.size,
    }))
    .sort((a, b) => b.received - a.received);
}
