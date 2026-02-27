#!/usr/bin/env python3
"""Apply patches to projects-list.tsx for TKX client creation UI."""

import sys

filepath = "/opt/plane-fork/apps/web/core/components/workspace/sidebar/projects-list.tsx"

with open(filepath, "r") as f:
    content = f.read()

# 1. Change the + button to create client when hasClients
old_tooltip = 'tooltipHeading={t("create_project")}'
new_tooltip = 'tooltipHeading={hasClients ? "Add Client" : t("create_project")}'
content = content.replace(old_tooltip, new_tooltip, 1)

old_onclick = """onClick={() => {
                        setIsProjectModalOpen(true);
                      }}
                      data-ph-element={PROJECT_TRACKER_ELEMENTS.SIDEBAR_CREATE_PROJECT_TOOLTIP}
                      className="hidden group-hover:inline-flex text-placeholder"
                      aria-label={t("aria_labels.projects_sidebar.create_new_project")}"""

new_onclick = """onClick={() => {
                        if (hasClients) {
                          setIsCreateClientOpen(true);
                        } else {
                          setIsProjectModalOpen(true);
                        }
                      }}
                      data-ph-element={PROJECT_TRACKER_ELEMENTS.SIDEBAR_CREATE_PROJECT_TOOLTIP}
                      className="hidden group-hover:inline-flex text-placeholder"
                      aria-label={hasClients ? "Add Client" : t("aria_labels.projects_sidebar.create_new_project")}"""

content = content.replace(old_onclick, new_onclick, 1)

# 2. Add the create client modal after CreateProjectModal closing tag
old_modal_close = """      )}
      <div
        ref={containerRef}"""

create_client_modal = '''      )}
      {/* TKX: Create Client Modal */}
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
      )}
      <div
        ref={containerRef}'''

content = content.replace(old_modal_close, create_client_modal, 1)

# Verify patches applied
checks = [
    ("Add Client tooltip", 'hasClients ? "Add Client"' in content),
    ("Create client onclick", "setIsCreateClientOpen(true)" in content),
    ("Create client modal", "Create Client Modal" in content),
    ("handleCreateClient", "handleCreateClient" in content),
]

all_ok = True
for name, result in checks:
    status = "OK" if result else "FAILED"
    print(f"  {status}: {name}")
    if not result:
        all_ok = False

if all_ok:
    with open(filepath, "w") as f:
        f.write(content)
    print("All patches applied successfully!")
else:
    print("ERROR: Some patches failed to apply!")
    sys.exit(1)
