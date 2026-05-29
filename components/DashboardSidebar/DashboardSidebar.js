"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar/Avatar";
import { enrichRecentProjects, getRecentProjects } from "@/lib/recentProjects";
import { useAnimatedLogout } from "@/hooks/useAnimatedLogout";
import { LogoutOverlay } from "@/components/AuthTransition/AuthTransition";
import { groupProjectsByFolder, isHighPriority } from "@/lib/workspaceSidebar";
import { normalizeListResponse } from "@/lib/apiList";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import { getStoredUser, getToken } from "@/api/client";
import { getWorkspaceTree } from "@/api/folders";
import { listProjects } from "@/api/projects";
import { useDashboardNav } from "@/context/DashboardNavContext";
import SidebarEmptyState from "@/components/SidebarEmptyState/SidebarEmptyState";
import NewFolderModal from "@/components/NewFolderModal/NewFolderModal";
import FolderProjectsModal from "@/components/FolderProjectsModal/FolderProjectsModal";
import { useWorkspaceTreeDnD } from "./WorkspaceTreeDnD";
import styles from "./DashboardSidebar.module.css";

function NavIcon({ type }) {
  const icons = {
    folder: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M3 6.5A1.5 1.5 0 0 1 4.5 5H8l1.5 2h6A1.5 1.5 0 0 1 17 8.5v6A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5v-8Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    ),
    file: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M6 3.5h5l3.5 3.5V16.5A1.5 1.5 0 0 1 13 18H7A1.5 1.5 0 0 1 5.5 16.5v-12A1.5 1.5 0 0 1 7 3.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M11 3.5V7H14.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  };

  return <span className={styles.navIcon}>{icons[type] || icons.folder}</span>;
}

function FolderTreeNode({
  folder,
  depth,
  expandedIds,
  onToggle,
  onManageFolder,
  onSelectProject,
  activeProjectId,
  managingFolderId,
  dnd,
}) {
  const isExpanded = expandedIds.has(folder.id);
  const rowPad = { paddingLeft: `calc(${depth * 12}px)` };
  const folderDrop = dnd.getFolderDropProps(folder.id);

  return (
    <>
      <div
        className={`${styles.folderRow} ${managingFolderId === folder.id ? styles.folderRowActive : ""} ${folderDrop.className || ""} ${dnd.isDragging("folder", folder.id) ? styles.dragSource : ""}`}
        style={rowPad}
        onDragOver={folderDrop.onDragOver}
        onDragLeave={folderDrop.onDragLeave}
        onDrop={folderDrop.onDrop}
      >
        <button
          type="button"
          className={styles.chevronBtn}
          aria-label={isExpanded ? "Recolher pasta" : "Expandir pasta"}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(folder.id);
          }}
        >
          <span
            className={`${styles.navArrow} ${styles.navArrowVisible} ${isExpanded ? styles.navArrowOpen : ""}`}
            aria-hidden="true"
          >
            ›
          </span>
        </button>
        <div
          role="button"
          tabIndex={0}
          className={`${styles.draggableRow} ${dnd.isPressing("folder", folder.id) ? styles.dragPressing : ""}`}
          {...dnd.getDraggableProps("folder", folder.id, folder.name)}
          onClick={dnd.guardClick(() => onManageFolder(folder))}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onManageFolder(folder);
            }
          }}
        >
          <NavIcon type="folder" />
          <span className={styles.navLabel}>{folder.name}</span>
          {(folder.files?.length || 0) > 0 && (
            <span className={styles.folderCount}>{folder.files.length}</span>
          )}
        </div>
      </div>

      {isExpanded &&
        folder.files?.map((project) => (
          <div
            key={project.id}
            className={styles.projectRowWrap}
            style={{ paddingLeft: `calc(var(--space-2) + 20px + ${depth * 12}px)` }}
          >
            <div
              role="button"
              tabIndex={0}
              className={`${styles.navItemIndent} ${styles.draggableRow} ${styles.projectRow} ${activeProjectId === project.id ? styles.active : ""} ${dnd.isPressing("project", project.id) ? styles.dragPressing : ""} ${dnd.isDragging("project", project.id) ? styles.dragSource : ""}`}
              {...dnd.getDraggableProps("project", project.id, project.name)}
              onClick={dnd.guardClick(() => onSelectProject(project))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectProject(project);
                }
              }}
            >
              <NavIcon type="file" />
              <span className={styles.navLabel}>{project.name}</span>
            </div>
          </div>
        ))}

      {isExpanded &&
        folder.children?.map((child) => (
          <div key={child.id}>
            <FolderTreeNode
              folder={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onManageFolder={onManageFolder}
              onSelectProject={onSelectProject}
              activeProjectId={activeProjectId}
              managingFolderId={managingFolderId}
              dnd={dnd}
            />
          </div>
        ))}
    </>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7.5 17.5h-2a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 5.5 2.5h2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M12.5 13.5 17 9l-4.5-4.5M17 9H7.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardSidebar() {
  const router = useRouter();
  const { selectedProjectId, selectProject } = useDashboardNav();
  const { isLoggingOut, logoutAnimated } = useAnimatedLogout();
  const user = getStoredUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState({ tree: [], rootFiles: [] });
  const [highPriorityGroups, setHighPriorityGroups] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState(null);
  const [manageFolder, setManageFolder] = useState(null);

  const dnd = useWorkspaceTreeDnD(workspace, setWorkspace, setExpandedIds);

  const projectsById = useMemo(
    () => new Map(allProjects.map((project) => [project.id, project])),
    [allProjects]
  );

  const loadSidebarData = useCallback(async () => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { ensureActiveTenant } = await import("@/lib/tenantContext");
      const tenantId = await ensureActiveTenant();

      if (!tenantId && getStoredUser()?.role === "super_admin") {
        setError("Nenhuma organização ativa. Crie uma conta em Cadastrar.");
        setLoading(false);
        return;
      }

      const [treeData, projectsData] = await Promise.all([
        getWorkspaceTree(),
        listProjects({ limit: 100 }),
      ]);

      const items = normalizeListResponse(projectsData);
      const highPriority = items.filter(isHighPriority);

      setWorkspace({
        tree: treeData?.tree || [],
        rootFiles: treeData?.rootFiles || [],
      });
      setHighPriorityGroups(groupProjectsByFolder(highPriority));
      setAllProjects(items);
      setRecentItems(enrichRecentProjects(getRecentProjects(), items));

      const rootFolderIds = (treeData?.tree || []).map((f) => f.id);
      setExpandedIds((prev) => new Set([...prev, ...rootFolderIds]));
    } catch (err) {
      setError(err.message || "Erro ao carregar workspace");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  useEffect(() => {
    function onRefresh() {
      loadSidebarData();
    }

    function onRecentUpdated() {
      setRecentItems(enrichRecentProjects(getRecentProjects(), allProjects));
    }

    window.addEventListener("myboard:workspace-refresh", onRefresh);
    window.addEventListener("myboard:recent-updated", onRecentUpdated);
    window.addEventListener("myboard:tenant-changed", onRefresh);

    return () => {
      window.removeEventListener("myboard:workspace-refresh", onRefresh);
      window.removeEventListener("myboard:recent-updated", onRecentUpdated);
      window.removeEventListener("myboard:tenant-changed", onRefresh);
    };
  }, [loadSidebarData, allProjects]);

  function toggleFolder(folderId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  function handleSelectProject(project) {
    selectProject(project);
  }

  function openNewFolderModal(parentId = null) {
    setNewFolderParentId(parentId);
    setFolderModalOpen(true);
  }

  function handleManageFolder(folder) {
    setManageFolder(folder);
    setExpandedIds((prev) => new Set(prev).add(folder.id));
  }

  const hasWorkspace =
    workspace.tree.length > 0 || workspace.rootFiles.length > 0;
  const profileName = user?.name || "Usuário";
  const rootFolderDrop = dnd.getRootDropProps("folders");
  const rootProjectDrop = dnd.getRootDropProps("projects");

  return (
    <>
      <LogoutOverlay visible={isLoggingOut} />

      <aside className={`${styles.sidebar} ${dnd.saving ? styles.sidebarSaving : ""}`} data-tour="sidebar-left">
        <div className={styles.profile}>
          <span className={styles.profileName} title={profileName}>
            {profileName}
          </span>
        </div>

        <div className={styles.scrollArea}>
        <div className={styles.section} data-tour="sidebar-recent">
          <p className={styles.groupLabel}>Recentes</p>
          {loading ? (
            <span className={styles.skeleton} />
          ) : recentItems.length === 0 ? (
            <SidebarEmptyState>Nenhum recente</SidebarEmptyState>
          ) : (
            recentItems.map((item) => {
              const fullProject = projectsById.get(item.id);
              const client = fullProject?.client || item.client;
              const avatarName = client?.name || item.name;

              return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${selectedProjectId === item.id ? styles.active : ""}`}
                onClick={() =>
                  handleSelectProject(
                    fullProject || {
                      id: item.id,
                      name: item.name,
                      slug: item.slug,
                      folder_id: item.folder_id,
                      client,
                    }
                  )
                }
              >
                <Avatar
                  src={getClientAvatarUrl(client)}
                  name={avatarName}
                  size="sm"
                  className={styles.recentAvatar}
                />
                <span className={styles.navLabel} title={item.name}>
                  {item.name}
                </span>
              </button>
              );
            })
          )}
        </div>

        <div className={styles.section}>
          <p className={styles.groupLabel}>Dashboards</p>
          <p className={styles.subGroupLabel}>Projetos prioridade alta</p>
          {loading ? (
            <span className={styles.skeleton} />
          ) : highPriorityGroups.length === 0 ? (
            <SidebarEmptyState>Sem prioridade alta</SidebarEmptyState>
          ) : (
            highPriorityGroups.map((group) => (
              <div key={group.folderId} className={styles.priorityGroup}>
                <div className={styles.navItemStatic}>
                  <span className={styles.navArrow} aria-hidden="true" />
                  <NavIcon type="folder" />
                  <span className={styles.navLabel}>{group.folderName}</span>
                </div>
                {group.projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={`${styles.navItemIndent} ${selectedProjectId === project.id ? styles.active : ""}`}
                    onClick={() => handleSelectProject(project)}
                  >
                    <NavIcon type="file" />
                    <span className={styles.navLabel}>{project.name}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className={styles.section} data-tour="sidebar-projects">
          <div className={styles.sectionHeader}>
            <p className={styles.groupLabel}>Projetos</p>
            {dnd.saving && <span className={styles.savingHint}>Salvando...</span>}
          </div>
          <p className={styles.dndHint}>Solte na pasta ou na área da raiz</p>

          {error && <SidebarEmptyState>{error}</SidebarEmptyState>}
          {!error && loading && <span className={styles.skeleton} />}
          {!error && !loading && !hasWorkspace && (
            <SidebarEmptyState>Nenhuma pasta</SidebarEmptyState>
          )}
          {!error && !loading && hasWorkspace && (
            <div
              className={`${styles.workspaceTree} ${rootFolderDrop.className || ""}`}
              onDragOver={rootFolderDrop.onDragOver}
              onDragLeave={rootFolderDrop.onDragLeave}
              onDrop={rootFolderDrop.onDrop}
            >
              {workspace.tree.map((folder) => (
                <div key={folder.id}>
                  <FolderTreeNode
                    folder={folder}
                    depth={0}
                    expandedIds={expandedIds}
                    onToggle={toggleFolder}
                    onManageFolder={handleManageFolder}
                    onSelectProject={handleSelectProject}
                    activeProjectId={selectedProjectId}
                    managingFolderId={manageFolder?.id}
                    dnd={dnd}
                  />
                </div>
              ))}

              <div
                className={`${styles.rootProjectsZone} ${rootProjectDrop.className || ""}`}
                onDragOver={rootProjectDrop.onDragOver}
                onDragLeave={rootProjectDrop.onDragLeave}
                onDrop={rootProjectDrop.onDrop}
              >
                {workspace.rootFiles.map((project) => (
                  <div key={project.id} className={styles.projectRowWrap}>
                    <div
                      role="button"
                      tabIndex={0}
                      className={`${styles.navItemIndent} ${styles.draggableRow} ${styles.projectRow} ${selectedProjectId === project.id ? styles.active : ""} ${dnd.isPressing("project", project.id) ? styles.dragPressing : ""} ${dnd.isDragging("project", project.id) ? styles.dragSource : ""}`}
                      {...dnd.getDraggableProps("project", project.id, project.name)}
                      onClick={dnd.guardClick(() => handleSelectProject(project))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectProject(project);
                        }
                      }}
                    >
                      <NavIcon type="file" />
                      <span className={styles.navLabel}>{project.name}</span>
                    </div>
                  </div>
                ))}
                {workspace.rootFiles.length === 0 && (
                  <p className={styles.rootDropLabel}>Solte projetos aqui (raiz)</p>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            className={styles.newFolderBtn}
            onClick={() => openNewFolderModal(null)}
          >
            <span className={styles.newFolderIcon} aria-hidden="true">
              +
            </span>
            Nova pasta
          </button>
        </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={logoutAnimated}
            disabled={isLoggingOut}
          >
            <LogoutIcon />
            <span>{isLoggingOut ? "Saindo..." : "Sair da conta"}</span>
          </button>
        </div>
      </aside>

      <NewFolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        parentId={newFolderParentId}
      />

      <FolderProjectsModal
        isOpen={Boolean(manageFolder)}
        folder={manageFolder}
        onClose={() => setManageFolder(null)}
      />
    </>
  );
}
