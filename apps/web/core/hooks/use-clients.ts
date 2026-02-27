/**
 * TKX Media - Client grouping hook
 * Fetches client data from the TKX Templates API for sidebar grouping
 */

import { useState, useEffect, useCallback } from "react";

export type TClientProject = {
  id: string;
  project_id: string;
  sort_order: number;
  created_at: string;
};

export type TClient = {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  logo_url: string | null;
  color: string;
  sort_order: number;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
  projects: TClientProject[];
};

export type TClientGrouping = {
  clients: TClient[];
  isLoading: boolean;
  error: string | null;
  projectClientMap: Map<string, TClient>;
  unassignedProjectIds: (allProjectIds: string[]) => string[];
  refetch: () => void;
};

export const useClients = (): TClientGrouping => {
  const [clients, setClients] = useState<TClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchClients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/templates/api/clients");
        if (!response.ok) {
          throw new Error(`Failed to fetch clients: ${response.status}`);
        }
        const data: TClient[] = await response.json();
        if (!cancelled) {
          setClients(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch clients");
          console.error("Failed to fetch clients:", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchClients();

    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  // Build a map of project_id -> client for quick lookups
  const projectClientMap = new Map<string, TClient>();
  clients.forEach((client) => {
    client.projects.forEach((cp) => {
      projectClientMap.set(cp.project_id, client);
    });
  });

  // Get unassigned project IDs (projects not linked to any client)
  const unassignedProjectIds = useCallback(
    (allProjectIds: string[]): string[] => {
      const assignedProjectIds = new Set<string>();
      clients.forEach((client) => {
        client.projects.forEach((cp) => {
          assignedProjectIds.add(cp.project_id);
        });
      });
      return allProjectIds.filter((id) => !assignedProjectIds.has(id));
    },
    [clients]
  );

  return {
    clients,
    isLoading,
    error,
    projectClientMap,
    unassignedProjectIds,
    refetch,
  };
};
