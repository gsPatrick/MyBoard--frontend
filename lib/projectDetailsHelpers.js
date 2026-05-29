import {
  createProjectDetail,
  listProjectDetails,
  updateProjectDetail,
} from "@/api/projectDetails";

export async function loadGroupedProjectDetails(projectId, { revealSecrets = false } = {}) {
  return listProjectDetails(projectId, {
    grouped: true,
    revealSecrets: revealSecrets ? "true" : undefined,
  });
}

export async function upsertMarkdownDetail(
  projectId,
  { key, category, label },
  markdown,
  existingDetail
) {
  const payload = {
    category,
    key,
    label,
    value_type: "markdown",
    value: markdown,
  };

  if (existingDetail?.id) {
    return updateProjectDetail(projectId, existingDetail.id, payload);
  }

  return createProjectDetail(projectId, payload);
}

export async function findDetailInProject(projectId, key) {
  const grouped = await loadGroupedProjectDetails(projectId);
  const all = Object.values(grouped || {}).flat();
  return all.find((item) => item.key === key) || null;
}
