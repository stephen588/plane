/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Modified by TKX Media: Added client grouping to sidebar
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PlusIcon, ChevronRightIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { Loader } from "@plane/ui";
import { copyUrlToClipboard, cn, orderJoinedProjects } from "@plane/utils";
// components
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { useClients } from "@/hooks/use-clients";
// plane web imports
import type { TProject } from "@/plane-web/types";
// local imports
import { SidebarProjectsListItem } from "./projects-list-item";
import { SidebarClientGroup } from "./sidebar-client-group";

export const SidebarProjectsList = observer(function SidebarProjectsList() {
  // states
  const [isAllProjectsListOpen, setIsAllProjectsListOpen] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // scroll animation state
  // TKX: Create client state
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientColor, setNewClientColor] = useState("#6366F1");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const { t } = useTranslation();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { preferences: projectPreferences } = useProjectNavigationPreferences();
  const { isExtendedProjectSidebarOpened, toggleExtendedProjectSidebar } = useAppTheme();

  const { loader, getPartialProjectById, joinedProjectIds: joinedProjects, updateProjectView } = useProject();
  // router params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  // TKX: Client grouping
  const { clients, isLoading: isClientsLoading, unassignedProjectIds, refetch: refetchClients } = useClients();

  const CLIENT_COLORS = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#F59E0B",
    "#22C55E",
    "#06B6D4",
    "#3B82F6",
    "#F97316",
    "#14B8A6",
  ];

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setIsCreatingClient(true);
    try {
      const resp = await fetch("/templates/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName.trim(),
          workspace_id: "0f692c12-0770-4325-a298-902f8036dfe7",
          color: newClientColor,
        }),
      });
      if (!resp.ok) throw new Error("Failed to create client");
      setNewClientName("");
      setNewClientColor("#6366F1");
      setIsCreateClientOpen(false);
      refetchClients();
    } catch (err) {
      console.error("Failed to create client:", err);
    } finally {
      setIsCreatingClient(false);
    }
  };

  // auth
  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  // Compute limited projects for main sidebar
  const displayedProjects = projectPreferences.showLimitedProjects
    ? joinedProjects.slice(0, projectPreferences.limitedProjectsCount)
    : joinedProjects;

  // Check if there are more projects to show
  const hasMoreProjects =
    projectPreferences.showLimitedProjects && joinedProjects.length > projectPreferences.limitedProjectsCount;

  // TKX: Group projects by client
  const clientGroups = useMemo(() => {
    const displayedSet = new Set(displayedProjects);

    // Build groups for each client
    const groups = clients
      .map((client) => {
        const clientProjectIds = client.projects.map((cp) => cp.project_id).filter((pid) => displayedSet.has(pid));
        // Sort client projects by the order they appear in displayedProjects
        clientProjectIds.sort((a, b) => displayedProjects.indexOf(a) - displayedProjects.indexOf(b));
        return { client, projectIds: clientProjectIds };
      })
      .filter((g) => g.projectIds.length > 0);

    // Sort groups by client sort_order then name
    groups.sort((a, b) => {
      if (a.client.sort_order !== b.client.sort_order) {
        return a.client.sort_order - b.client.sort_order;
      }
      return a.client.name.localeCompare(b.client.name);
    });

    // Unassigned projects
    const unassigned = unassignedProjectIds(displayedProjects);

    return { groups, unassigned };
  }, [clients, displayedProjects, unassignedProjectIds]);

  const handleCopyText = (projectId: string) => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/issues`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("project_link_copied_to_clipboard"),
      });
    });
  };

  const handleOnProjectDrop = (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => {
    if (!sourceId || !destinationId || !workspaceSlug) return;
    if (sourceId === destinationId) return;

    const joinedProjectsList: TProject[] = [];
    joinedProjects.map((projectId) => {
      const projectDetails = getPartialProjectById(projectId);
      if (projectDetails) joinedProjectsList.push(projectDetails);
    });

    const sourceIndex = joinedProjects.indexOf(sourceId);
    const destinationIndex = shouldDropAtEnd ? joinedProjects.length : joinedProjects.indexOf(destinationId);

    if (joinedProjectsList.length <= 0) return;

    const updatedSortOrder = orderJoinedProjects(sourceIndex, destinationIndex, sourceId, joinedProjectsList);
    if (updatedSortOrder != undefined)
      updateProjectView(workspaceSlug.toString(), sourceId, { sort_order: updatedSortOrder }).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("something_went_wrong"),
        });
      });
  };

  /**
   * Implementing scroll animation styles based on the scroll length of the container
   */
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsScrolled(scrollTop > 0);
      }
    };
    const currentContainerRef = containerRef.current;
    if (currentContainerRef) {
      currentContainerRef.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (currentContainerRef) {
        currentContainerRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [containerRef]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
        canScroll: ({ source }) => source?.data?.dragInstanceId === "PROJECTS",
        getAllowedAxis: () => "vertical",
      })
    );
  }, [containerRef]);

  const toggleListDisclosure = (isOpen: boolean) => {
    setIsAllProjectsListOpen(isOpen);
    localStorage.setItem("isAllProjectsListOpen", isOpen.toString());
  };
  useEffect(() => {
    if (pathname.includes("projects")) {
      setIsAllProjectsListOpen(true);
      localStorage.setItem("isAllProjectsListOpen", "true");
    }
  }, [pathname]);

  // Determine if we have client data to show grouped view
  const hasClients = clients.length > 0;

  return (
    <>
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          setToFavorite={false}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      {/* TKX: Create Client Modal */}
      {isCreateClientOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4"
            style={{ maxHeight: "90vh", overflow: "auto" }}
          >
            <div className="p-5 border-b" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-base font-semibold" style={{ color: "#111827" }}>
                New Client
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
                  Client Name
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") handleCreateClient();
                    if (e.key === "Escape") setIsCreateClientOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    color: "#111827",
                    backgroundColor: "#fff",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CLIENT_COLORS.map((c: string) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewClientColor(c)}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: c,
                        border: newClientColor === c ? "2px solid #4f46e5" : "2px solid transparent",
                        outline: newClientColor === c ? "2px solid #4f46e5" : "none",
                        outlineOffset: "2px",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end p-5" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button
                type="button"
                onClick={() => {
                  setIsCreateClientOpen(false);
                  setNewClientName("");
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "14px",
                  color: "#6b7280",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  border: "none",
                }}
                onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingClient || !newClientName.trim()}
                onClick={handleCreateClient}
                style={{
                  padding: "6px 16px",
                  fontSize: "14px",
                  backgroundColor: isCreatingClient || !newClientName.trim() ? "#9ca3af" : "#4f46e5",
                  color: "#fff",
                  borderRadius: "8px",
                  cursor: isCreatingClient || !newClientName.trim() ? "not-allowed" : "pointer",
                  border: "none",
                }}
              >
                {isCreatingClient ? "Creating..." : "Create Client"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn({
          "border-t border-strong": isScrolled,
        })}
      >
        <>
          <Disclosure as="div" className="flex flex-col" defaultOpen={isAllProjectsListOpen}>
            <div className="group w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-placeholder hover:bg-layer-transparent-hover">
              <Disclosure.Button
                as="button"
                type="button"
                className="w-full flex items-center gap-1 whitespace-nowrap text-left text-13 font-semibold text-placeholder"
                onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
                aria-label={t(
                  isAllProjectsListOpen
                    ? "aria_labels.projects_sidebar.close_projects_menu"
                    : "aria_labels.projects_sidebar.open_projects_menu"
                )}
              >
                <span className="text-13 font-semibold">{hasClients ? "Clients" : t("projects")}</span>
              </Disclosure.Button>
              <div className="flex items-center gap-1">
                {isAuthorizedUser && (
                  <Tooltip tooltipHeading={hasClients ? "Add Client" : t("create_project")} tooltipContent="">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={PlusIcon}
                      onClick={() => {
                        if (hasClients) {
                          setIsCreateClientOpen(true);
                        } else {
                          setIsProjectModalOpen(true);
                        }
                      }}
                      data-ph-element={PROJECT_TRACKER_ELEMENTS.SIDEBAR_CREATE_PROJECT_TOOLTIP}
                      className="hidden group-hover:inline-flex text-placeholder"
                      aria-label={hasClients ? "Add Client" : t("aria_labels.projects_sidebar.create_new_project")}
                    />
                  </Tooltip>
                )}
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={ChevronRightIcon}
                  onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
                  className="text-placeholder"
                  iconClassName={cn("transition-transform", {
                    "rotate-90": isAllProjectsListOpen,
                  })}
                  aria-label={t(
                    isAllProjectsListOpen
                      ? "aria_labels.projects_sidebar.close_projects_menu"
                      : "aria_labels.projects_sidebar.open_projects_menu"
                  )}
                />
              </div>
            </div>
            <Transition
              show={isAllProjectsListOpen}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              {loader === "init-loader" && (
                <Loader className="w-full space-y-1.5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Loader.Item key={index} height="28px" />
                  ))}
                </Loader>
              )}
              {isAllProjectsListOpen && (
                <Disclosure.Panel as="div" className="flex flex-col gap-0.5" static>
                  {hasClients ? (
                    <>
                      {/* Client-grouped projects */}
                      {clientGroups.groups.map(({ client, projectIds }) => (
                        <SidebarClientGroup
                          key={client.id}
                          client={client}
                          projectIds={projectIds}
                          handleCopyText={handleCopyText}
                          handleOnProjectDrop={handleOnProjectDrop}
                        />
                      ))}
                      {/* Unassigned projects */}
                      {clientGroups.unassigned.length > 0 && (
                        <SidebarClientGroup
                          key="unassigned"
                          client={null}
                          projectIds={clientGroups.unassigned}
                          handleCopyText={handleCopyText}
                          handleOnProjectDrop={handleOnProjectDrop}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Fallback: Original flat project list when no clients exist */}
                      {displayedProjects.map((projectId, index) => (
                        <SidebarProjectsListItem
                          key={projectId}
                          projectId={projectId}
                          handleCopyText={() => handleCopyText(projectId)}
                          projectListType={"JOINED"}
                          disableDrag={false}
                          disableDrop={false}
                          isLastChild={index === displayedProjects.length - 1}
                          handleOnProjectDrop={handleOnProjectDrop}
                        />
                      ))}
                    </>
                  )}
                  {hasMoreProjects && (
                    <SidebarNavItem>
                      <button
                        type="button"
                        onClick={() => toggleExtendedProjectSidebar()}
                        className="flex items-center gap-1.5 text-13 font-medium flex-grow text-tertiary"
                        id="extended-project-sidebar-toggle"
                        aria-label={t(
                          isExtendedProjectSidebarOpened
                            ? "aria_labels.app_sidebar.close_extended_sidebar"
                            : "aria_labels.app_sidebar.open_extended_sidebar"
                        )}
                      >
                        <Ellipsis className="flex-shrink-0 size-4" />
                        <span>{isExtendedProjectSidebarOpened ? "Hide" : "More"}</span>
                      </button>
                    </SidebarNavItem>
                  )}
                </Disclosure.Panel>
              )}
            </Transition>
          </Disclosure>
        </>

        {isAuthorizedUser && joinedProjects?.length === 0 && (
          <button
            type="button"
            data-ph-element={PROJECT_TRACKER_ELEMENTS.SIDEBAR_CREATE_PROJECT_BUTTON}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-13 leading-5 font-medium text-secondary hover:bg-surface-2 rounded-md"
            onClick={() => {
              toggleCreateProjectModal(true);
            }}
          >
            {t("add_project")}
          </button>
        )}
      </div>
    </>
  );
});
