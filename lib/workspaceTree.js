export const DND_MIME = "application/x-myboard-workspace-item";

export function createDragPayload(type, id) {
  return JSON.stringify({ type, id });
}

export function parseDragPayload(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if ((parsed.type === "folder" || parsed.type === "project") && parsed.id) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function cloneWorkspace(workspace) {
  return JSON.parse(JSON.stringify(workspace));
}

export function flattenWorkspaceForReorder(workspace) {
  const folders = [];
  const projects = [];

  function walkFolders(nodes, parentId) {
    (nodes || []).forEach((folder, index) => {
      folders.push({
        id: folder.id,
        parent_id: parentId,
        sort_order: index,
      });

      (folder.files || []).forEach((project, projectIndex) => {
        projects.push({
          id: project.id,
          folder_id: folder.id,
          sort_order: projectIndex,
        });
      });

      walkFolders(folder.children || [], folder.id);
    });
  }

  walkFolders(workspace.tree || [], null);

  (workspace.rootFiles || []).forEach((project, index) => {
    projects.push({
      id: project.id,
      folder_id: null,
      sort_order: index,
    });
  });

  return { folders, projects };
}

function removeProjectFromWorkspace(workspace, projectId) {
  let removed = null;

  function stripFromFolders(nodes) {
    nodes.forEach((folder) => {
      if (!removed && folder.files?.length) {
        const index = folder.files.findIndex((file) => file.id === projectId);
        if (index >= 0) {
          removed = folder.files.splice(index, 1)[0];
        }
      }
      if (!removed) stripFromFolders(folder.children || []);
    });
  }

  stripFromFolders(workspace.tree || []);

  if (!removed && workspace.rootFiles?.length) {
    const index = workspace.rootFiles.findIndex((file) => file.id === projectId);
    if (index >= 0) removed = workspace.rootFiles.splice(index, 1)[0];
  }

  return removed;
}

function removeFolderFromWorkspace(workspace, folderId) {
  function stripFrom(nodes) {
    const index = nodes.findIndex((folder) => folder.id === folderId);
    if (index >= 0) {
      return nodes.splice(index, 1)[0];
    }

    for (const folder of nodes) {
      const removed = stripFrom(folder.children || []);
      if (removed) return removed;
    }

    return null;
  }

  return stripFrom(workspace.tree || []);
}

function findFolderNode(nodes, folderId) {
  for (const folder of nodes || []) {
    if (folder.id === folderId) return folder;
    const nested = findFolderNode(folder.children, folderId);
    if (nested) return nested;
  }
  return null;
}

function folderContainsDescendant(folder, targetFolderId) {
  for (const child of folder.children || []) {
    if (child.id === targetFolderId) return true;
    if (folderContainsDescendant(child, targetFolderId)) return true;
  }
  return false;
}

export function isInvalidFolderNest(workspace, folderId, targetFolderId) {
  if (folderId === targetFolderId) return true;
  if (!targetFolderId) return false;

  const probe = cloneWorkspace(workspace);
  const source = removeFolderFromWorkspace(probe, folderId);
  if (!source) return true;

  return folderContainsDescendant(source, targetFolderId);
}

export function applyProjectDrop(workspace, projectId, target) {
  const next = cloneWorkspace(workspace);
  const project = removeProjectFromWorkspace(next, projectId);
  if (!project) return null;

  if (target.type === "root") {
    const index = Math.min(target.index ?? next.rootFiles.length, next.rootFiles.length);
    next.rootFiles.splice(index, 0, project);
    return next;
  }

  if (target.type === "folder") {
    const folder = findFolderNode(next.tree, target.folderId);
    if (!folder) return null;
    if (!folder.files) folder.files = [];
    const index = Math.min(target.index ?? folder.files.length, folder.files.length);
    folder.files.splice(index, 0, project);
    return next;
  }

  return null;
}

export function applyFolderDrop(workspace, folderId, target) {
  const next = cloneWorkspace(workspace);
  const folder = removeFolderFromWorkspace(next, folderId);
  if (!folder) return null;

  if (target.type === "root") {
    if (isInvalidFolderNest(workspace, folderId, null)) return null;
    const index = Math.min(target.index ?? next.tree.length, next.tree.length);
    next.tree.splice(index, 0, folder);
    return next;
  }

  if (target.type === "folder") {
    if (isInvalidFolderNest(workspace, folderId, target.folderId)) return null;
    const parent = findFolderNode(next.tree, target.folderId);
    if (!parent) return null;
    if (!parent.children) parent.children = [];
    const index = Math.min(target.index ?? parent.children.length, parent.children.length);
    parent.children.splice(index, 0, folder);
    return next;
  }

  return null;
}

