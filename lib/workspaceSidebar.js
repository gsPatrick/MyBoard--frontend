const HIGH_PRIORITIES = new Set(["high", "critical"]);

export function isHighPriority(project) {
  return HIGH_PRIORITIES.has(project?.priority);
}

export function groupProjectsByFolder(projects = []) {
  const map = new Map();

  for (const project of projects) {
    const folderId = project.folder?.id || project.folder_id || "__root__";
    const folderName = project.folder?.name || "Sem pasta";

    if (!map.has(folderId)) {
      map.set(folderId, {
        folderId,
        folderName,
        folder: project.folder || null,
        projects: [],
      });
    }

    map.get(folderId).projects.push(project);
  }

  return Array.from(map.values()).sort((a, b) => a.folderName.localeCompare(b.folderName));
}

export function collectFolderIds(tree = []) {
  const ids = [];

  function walk(nodes) {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children?.length) walk(node.children);
    }
  }

  walk(tree);
  return ids;
}

export function flattenTreeProjects(tree = [], rootFiles = []) {
  const projects = [...rootFiles];

  function walk(nodes) {
    for (const node of nodes) {
      if (node.files?.length) projects.push(...node.files);
      if (node.children?.length) walk(node.children);
    }
  }

  walk(tree);
  return projects;
}
