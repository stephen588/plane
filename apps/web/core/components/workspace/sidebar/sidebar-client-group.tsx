/**
 * TKX Media - Client group accordion for the sidebar
 * Renders a collapsible client section with its assigned projects
 * + button opens Plane's Create Project modal (project auto-assigned to this client)
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { PlusIcon, ChevronRightIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { cn } from "@plane/utils";
import { CreateProjectModal } from "@/components/project/create-project-modal";
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
  const { workspaceSlug } = useParams();

  const storageKey = client ? `client-group-open-${client.id}` : "client-group-open-unassigned";
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === "true" : true;
  });
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

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

  // When a project is created under this client, auto-assign it
  const handleProjectCreated = async (projectId: string) => {
    if (!client) return;
    try {
      await fetch(`/templates/api/clients/${client.id}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      // Force a page refresh to pick up the new assignment
      window.location.reload();
    } catch (err) {
      console.error("Failed to assign project to client:", err);
    }
  };

  if (projectIds.length === 0 && !client) return null;

  const groupName = client ? client.name : "Unassigned";
  const groupColor = client ? client.color : "#9CA3AF"; // gray for unassigned

  return (
    <>
      {/* Create Project Modal for this client */}
      {workspaceSlug && client && (
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          setToFavorite={false}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <Disclosure as="div" className="flex flex-col" defaultOpen={isOpen}>
        <div className="group w-full flex items-center justify-between px-2 py-1 rounded-sm text-placeholder hover:bg-layer-transparent-hover relative">
          <Disclosure.Button
            as="button"
            type="button"
            className="w-full flex items-center gap-1.5 whitespace-nowrap text-left text-12 font-medium text-tertiary"
            onClick={() => toggleOpen(!isOpen)}
          >
            <span className="flex-shrink-0 size-2.5 rounded-full" style={{ backgroundColor: groupColor }} />
            <span className="truncate">{groupName}</span>
            <span className="text-11 text-placeholder ml-0.5">({projectIds.length})</span>
          </Disclosure.Button>
          <div className="flex items-center gap-0.5">
            {/* + button: opens Create Project modal for this client */}
            {client && (
              <IconButton
                variant="ghost"
                size="sm"
                icon={PlusIcon}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsCreateProjectOpen(true);
                }}
                className="hidden group-hover:inline-flex text-placeholder"
                aria-label={`Create project under ${client.name}`}
              />
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
    </>
  );
});
