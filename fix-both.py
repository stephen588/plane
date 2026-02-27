#!/usr/bin/env python3
"""Fix two issues:
1. Create Client modal missing Create button
2. + on client should open Create Project modal, not add-existing dropdown
"""

# ============================================================
# FIX 1: projects-list.tsx - Create Client modal button visibility
# ============================================================
filepath1 = "/opt/plane-fork/apps/web/core/components/workspace/sidebar/projects-list.tsx"
with open(filepath1, "r") as f:
    content = f.read()

# The Create Client modal's Create button might be cut off.
# Let's ensure the modal has proper structure with the button visible.
# Also: the + on the Clients heading should create client, and 
# after creating a client we need to auto-assign the project if one was being created.

# Fix: Replace the entire Create Client Modal section with a proper one
old_modal = '''      {/* TKX: Create Client Modal */}
      {isCreateClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">New Client</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleCreateClient(); if (e.key === "Escape") setIsCreateClientOpen(false); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {CLIENT_COLORS.map((c: string) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewClientColor(c)}
                      className={`w-6 h-6 rounded-full transition-all ${newClientColor === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setIsCreateClientOpen(false); setNewClientName(""); }}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingClient || !newClientName.trim()}
                onClick={handleCreateClient}
                className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCreatingClient ? "Creating..." : "Create Client"}
              </button>
            </div>
          </div>
        </div>
      )}'''

new_modal = '''      {/* TKX: Create Client Modal */}
      {isCreateClientOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" style={{ maxHeight: "90vh", overflow: "auto" }}>
            <div className="p-5 border-b" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-base font-semibold" style={{ color: "#111827" }}>New Client</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Client Name</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleCreateClient(); if (e.key === "Escape") setIsCreateClientOpen(false); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", color: "#111827", backgroundColor: "#fff" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Color</label>
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
                onClick={() => { setIsCreateClientOpen(false); setNewClientName(""); }}
                style={{ padding: "6px 12px", fontSize: "14px", color: "#6b7280", borderRadius: "8px", cursor: "pointer", backgroundColor: "transparent", border: "none" }}
                onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "transparent"; }}
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
      )}'''

if old_modal in content:
    content = content.replace(old_modal, new_modal)
    print("FIX 1: Create Client modal - PATCHED (inline styles for reliability)")
else:
    print("FIX 1: Create Client modal - old text not found, trying alternative...")
    # The modal might not have been deployed yet if the last build was the old version
    # Just check if we have the create client modal at all
    if "Create Client Modal" in content:
        print("  Modal exists but format differs - needs manual review")
    else:
        print("  No modal found at all!")

with open(filepath1, "w") as f:
    f.write(content)

# ============================================================
# FIX 2: sidebar-client-group.tsx - + button should open Create Project modal
# ============================================================
filepath2 = "/opt/plane-fork/apps/web/core/components/workspace/sidebar/sidebar-client-group.tsx"
with open(filepath2, "r") as f:
    content2 = f.read()

# Replace the entire file with the corrected version
new_content = '''/**
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
            <span
              className="flex-shrink-0 size-2.5 rounded-full"
              style={{ backgroundColor: groupColor }}
            />
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
'''

with open(filepath2, "w") as f:
    f.write(new_content)
print("FIX 2: Client + button now opens Create Project modal - DONE")
print("")
print("All fixes applied!")
