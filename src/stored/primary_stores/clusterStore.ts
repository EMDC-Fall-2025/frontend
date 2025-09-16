import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Cluster } from "../../types";

interface ClusterState {
  cluster: Cluster | null;
  isLoadingCluster: boolean;
  clusterError: string | null;
  fetchClusterById: (clusterId: number) => Promise<void>;
  createCluster: (data: {
    cluster_name: string;
    contestid: number;
  }) => Promise<void>;
  editCluster: (data: { id: number; cluster_name: string }) => Promise<void>;
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
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/cluster/get/${clusterId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ cluster: response.data });
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
        contestid: number;
      }) => {
        set({ isLoadingCluster: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(`/api/cluster/create/`, data, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ cluster: response.data });
          set({ clusterError: null });
        } catch (error) {
          const errorMessage = "Failed to create cluster";
          set({ clusterError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingCluster: false });
        }
      },

      editCluster: async (data: { id: number; cluster_name: string }) => {
        set({ isLoadingCluster: true });
        try {
          const token = localStorage.getItem("token");
          await axios.post(`/api/cluster/edit/`, data, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ clusterError: null });
        } catch (error) {
          const errorMessage = "Failed to edit cluster";
          set({ clusterError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingCluster: false });
        }
      },

      deleteCluster: async (clusterId: number) => {
        set({ isLoadingCluster: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/cluster/delete/${clusterId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ cluster: null });
          set({ clusterError: null });
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
