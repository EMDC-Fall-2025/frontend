import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Cluster } from "../../types";
import { dispatchDataChange } from "../../utils/dataChangeEvents";

interface ClusterState {
  cluster: Cluster | null;
  isLoadingCluster: boolean;
  clusterError: string | null;
  fetchClusterById: (clusterId: number) => Promise<void>;
  createCluster: (data: {
    cluster_name: string;
    cluster_type?: string;
    contestid: number;
  }) => Promise<Cluster>;
  editCluster: (data: { id: number; cluster_name: string; cluster_type?: string }) => Promise<Cluster>;
  deleteCluster: (clusterId: number) => Promise<void>;
  clearCluster: () => void;
}

export const useClusterStore = create<ClusterState>()(
  persist(
    (set) => ({
      cluster: null,
      isLoadingCluster: false,
      clusterError: null,

      clearCluster: async () => {
        try {
          set({ cluster: null });
        } catch (error) {
          set({ clusterError: "Error clearing out cluster in state" });
          throw new Error("Error clearing out cluster in state");
        }
      },

      fetchClusterById: async (clusterId: number) => {
        set({ isLoadingCluster: true });
        try {
          const response = await api.get(`/api/cluster/get/${clusterId}/`);
          // API returns { Cluster: {...} }
          set({ cluster: (response.data as any)?.Cluster ?? null });
          set({ clusterError: null });
        } catch (error) {
          const errorMessage = "Failed to fetch cluster";
          set({ clusterError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingCluster: false });
        }
      },

      createCluster: async (data: {
        cluster_name: string;
        cluster_type?: string;
        contestid: number;
      }) => {
        set({ isLoadingCluster: true });
        try {
          const response = await api.post(`/api/cluster/create/`, data);
          const createdCluster = (response.data as any)?.cluster || response.data;
          set({ cluster: createdCluster });
          set({ clusterError: null });
          // Dispatch event to notify other components
          if (createdCluster?.id) {
            dispatchDataChange({ type: 'cluster', action: 'create', id: createdCluster.id, contestId: data.contestid });
          }
          return createdCluster;
        } catch (error) {
          const errorMessage = "Failed to create cluster";
          set({ clusterError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingCluster: false });
        }
      },

      editCluster: async (data: { id: number; cluster_name: string; cluster_type?: string }) => {
        set({ isLoadingCluster: true });
        try {
          const res = await api.post(`/api/cluster/edit/`, data);
          if (res.status !== 200) {
            throw new Error(`Unexpected status ${res.status}`);
          }
          set({ clusterError: null });
          const updatedCluster = (res.data as any)?.cluster;
          // Dispatch event to notify other components
          if (updatedCluster?.id) {
            dispatchDataChange({ type: 'cluster', action: 'update', id: updatedCluster.id });
          }
          return updatedCluster;
        } catch (error: any) {
          const msg = error?.response?.data?.detail || error?.message || "Failed to edit cluster";
          set({ clusterError: msg });
          throw new Error(msg);
        } finally {
          set({ isLoadingCluster: false });
        }
      },

      deleteCluster: async (clusterId: number) => {
        set({ isLoadingCluster: true });
        try {
          await api.delete(`/api/cluster/delete/${clusterId}/`);
          set({ cluster: null });
          set({ clusterError: null });
          // Dispatch event to notify other components
          dispatchDataChange({ type: 'cluster', action: 'delete', id: clusterId });
        } catch (error) {
          const errorMessage = "Failed to delete cluster";
          set({ clusterError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingCluster: false });
        }
      },
    }),
    {
      name: "cluster-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useClusterStore;
