import { create } from "zustand";
import axios from "axios";
import { persist, createJSONStorage } from "zustand/middleware";
import { Judge, Cluster } from "../../types";

interface MapClusterJudgeState {
  judgesByClusterId: { [key: number]: Judge[] };
  judgeClusters: Record<number, Cluster>;
  isLoadingMapClusterJudge: boolean;
  cluster: Cluster | null;
  mapClusterJudgeError: string | null;

  fetchJudgesByClusterId: (clusterId: number) => Promise<void>;
  fetchClusterByJudgeId: (judgeId: number) => Promise<void>;
  fetchClustersForJudges: (judges: Judge[]) => Promise<void>;
  createClusterJudgeMapping: (mapData: any) => Promise<void>;
  deleteClusterJudgeMapping: (
    mapId: number,
    clusterId: number
  ) => Promise<void>;
  clearJudgesByClusterId: () => void;
  clearCluster: () => void;
  clearJudgeClusters: () => void;
}

export const useMapClusterJudgeStore = create<MapClusterJudgeState>()(
  persist(
    (set) => ({
      judgesByClusterId: {},
      judgeClusters: {},
      isLoadingMapClusterJudge: false,
      mapClusterJudgeError: null,
      cluster: null,

      clearJudgeClusters: () => {
        try {
          set({ judgeClusters: {} });
          set({ mapClusterJudgeError: null });
        } catch (error) {
          const errorMessage = "Error clearing out judgeClusters in state";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      clearCluster: () => {
        try {
          set({ cluster: null });
          set({ mapClusterJudgeError: null });
        } catch (error) {
          const errorMessage = "Error clearing out cluster in state";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      clearJudgesByClusterId: () => {
        try {
          set({ judgesByClusterId: {} });
          set({ mapClusterJudgeError: null });
        } catch (error) {
          const errorMessage = "Error clearing out judgesByClusterId in state";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      fetchJudgesByClusterId: async (clusterId) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/clusterToJudge/getAllJudgesByCluster/${clusterId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set((state) => ({
            judgesByClusterId: {
              ...state.judgesByClusterId,
              [clusterId]: response.data.Judges,
            },
            mapClusterJudgeError: null,
          }));
        } catch (error) {
          const errorMessage = "Error fetching judges by cluster ID";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterJudge: false });
        }
      },

      fetchClusterByJudgeId: async (judgeId) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/clusterToJudge/getClusterByJudge/${judgeId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set({ cluster: response.data.Cluster, mapClusterJudgeError: null });
        } catch (error) {
          const errorMessage = "Error fetching cluster by judge ID";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterJudge: false });
        }
      },

      fetchClustersForJudges: async (judges) => {
        set({ isLoadingMapClusterJudge: true });
        const clusters: Record<number, Cluster> = {};
        try {
          const token = localStorage.getItem("token");

          await Promise.all(
            judges.map(async (judge) => {
              const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/mapping/clusterToJudge/getClusterByJudge/${judge.id}/`,
                {
                  headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              clusters[judge.id] = response.data.Cluster;
            })
          );

          set({ judgeClusters: clusters, mapClusterJudgeError: null });
        } catch (error) {
          const errorMessage = "Error fetching clusters for judges";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterJudge: false });
        }
      },

      createClusterJudgeMapping: async (mapData) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/clusterToJudge/create/`,
            mapData,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          return response.data;
        } catch (error) {
          const errorMessage = "Error creating cluster-judge mapping";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterJudge: false });
        }
      },

      deleteClusterJudgeMapping: async (mapId, clusterId) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/mapping/clusterToJudge/delete/${mapId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });

          set((state) => ({
            judgesByClusterId: {
              ...state.judgesByClusterId,
              [clusterId]:
                state.judgesByClusterId[clusterId]?.filter(
                  (judge) => judge.id !== mapId
                ) || [],
            },
            mapClusterJudgeError: null,
          }));
        } catch (error) {
          const errorMessage = "Error deleting cluster-judge mapping";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterJudge: false });
        }
      },
    }),
    {
      name: "map-cluster-judge-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
