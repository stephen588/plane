/**
 * TKX Media - Client group accordion for the sidebar
 * Renders a collapsible client section with its assigned projects
 * + button on hover to add unassigned projects to this client
 */

import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { PlusIcon, ChevronRightIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { cn } from "@plane/utils";
import { useProject } from "@/hooks/store/use-project";
import { useClients } from "@/hooks/use-clients";
// local imports
import { SidebarProjectsListItem } from "./projects-list-item";
import type { TClient } from "@/hooks/use-clients";

type Props = {
  client: TClient | null; // null means "Unassigned"
  projectIds: string[];
  handleCopyText: (projectId: string) => void;
  handleOnProjectDrop: (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => void;
};

export const SidebarClientGroup = observer(function SidebarClientGroup(props: Props) {
  const { client, projectIds, handleCopyText, handleOnProjectDrop } = props;
  const pathname = usePathname();
  const { getPartialProjectById, joinedProjectIds } = useProject();
  const { clients, refetch } = useClients();

  const storageKey = client ? `client-group-open-${client.id}` : "client-group-open-unassigned";
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === "true" : true;
  });
  const [showAddProject, setShowAddProject] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const addProjectRef = useRef<HTMLDivElement>(null);

  const toggleOpen = (value: boolean) => {
    setIsOpen(value);
    localStorage.setItem(storageKey, value.toString());
  };

  // Auto-expand if navigating to a project within this group
  useEffect(() => {
    if (pathname.includes("projects")) {
      const activeProjectId = projectIds.find((id) => pathname.includes(id));
      if (activeProjectId) {
        setIsOpen(true);
        localStorage.setItem(storageKey, "true");
      }
    }
  }, [pathname, projectIds, storageKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addProjectRef.current && !addProjectRef.current.contains(e.target as Node)) {
        setShowAddProject(false);
      }
    };
    if (showAddProject) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddProject]);

  // Get projects that aren't assigned to any client (available to add)
  const assignedProjectIds = new Set<string>();
  clients.forEach((c) => {
    c.projects.forEach((cp) => assignedProjectIds.add(cp.project_id));
  });

  const availableProjects = joinedProjectIds
    .filter((pid) => !assignedProjectIds.has(pid))
    .map((pid) => {
      const proj = getPartialProjectById(pid);
      return proj ? { id: pid, name: proj.name, identifier: proj.identifier } : null;
    })
    .filter(Boolean) as { id: string; name: string; identifier: string }[];

  const handleAddProject = async (projectId: string) => {
    if (!client) return;
    setAddingProject(true);
    try {
      const resp = await fetch(`/templates/api/clients/${client.id}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (!resp.ok) throw new Error("Failed to add project");
      setShowAddProject(false);
      refetch();
    } catch (err) {
      console.error("Failed to add project to client:", err);
    } finally {
      setAddingProject(false);
    }
  };

  if (projectIds.length === 0 && !client) return null;

  const groupName = client ? client.name : "Unassigned";
  const groupColor = client ? client.color : "#9CA3AF"; // gray for unassigned

  return (
    <Disclosure as="div" className="flex flex-col" defaultOpen={isOpen}>
      <div className="group w-full flex items-center justify-between px-2 py-1 rounded-sm text-placeholder hover:bg-layer-transparent-hover relative">
        <Disclosure.Button
          as="button"
          type="button"
          className="w-full flex items-center gap-1.5 whitespace-nowrap text-left text-12 font-medium text-tertiary"
          onClick={() => toggleOpen(!isOpen)}
        >
          <span
            className="flex-shrink-0 size-2.5 rounded-full"
            style={{ backgroundColor: groupColor }}
          />
          <span className="truncate">{groupName}</span>
          <span className="text-11 text-placeholder ml-0.5">({projectIds.length})</span>
        </Disclosure.Button>
        <div className="flex items-center gap-0.5">
          {/* Add project button (only for real clients, not Unassigned) */}
          {client && (
            <div className="relative" ref={addProjectRef}>
              <IconButton
                variant="ghost"
                size="sm"
                icon={PlusIcon}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setShowAddProject(!showAddProject);
                }}
                className="hidden group-hover:inline-flex text-placeholder"
                aria-label="Add project to client"
              />
              {/* Add project dropdown */}
              {showAddProject && (
                <div className="absolute top-full right-0 mt-1 z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="px-3 py-2 text-[11px] font-medium text-gray-500 border-b border-gray-100">
                    Add project to {client.name}
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {availableProjects.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-gray-400">No unassigned projects</div>
                    ) : (
                      availableProjects.map((proj) => (
                        <button
                          key={proj.id}
                          type="button"
                          disabled={addingProject}
                          onClick={() => handleAddProject(proj.id)}
                          className="w-full px-3 py-1.5 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center justify-between disabled:opacity-50"
                        >
                          <span className="truncate">{proj.name}</span>
                          <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{proj.identifier}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            icon={ChevronRightIcon}
            onClick={() => toggleOpen(!isOpen)}
            className="text-placeholder flex-shrink-0"
            iconClassName={cn("transition-transform size-3", {
              "rotate-90": isOpen,
            })}
            aria-label={isOpen ? "Collapse client group" : "Expand client group"}
          />
        </div>
      </div>
      <Transition
        show={isOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isOpen && (
          <Disclosure.Panel as="div" className="flex flex-col gap-0.5 pl-1" static>
            {projectIds.map((projectId, index) => (
              <SidebarProjectsListItem
                key={projectId}
                projectId={projectId}
                handleCopyText={() => handleCopyText(projectId)}
                projectListType={"JOINED"}
                disableDrag={false}
                disableDrop={false}
                isLastChild={index === projectIds.length - 1}
                handleOnProjectDrop={handleOnProjectDrop}
              />
            ))}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
