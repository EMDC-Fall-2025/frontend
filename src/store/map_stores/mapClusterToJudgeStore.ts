import { create } from "zustand";
import { api } from "../../lib/api";
import { persist, createJSONStorage } from "zustand/middleware";
import { Judge, Cluster } from "../../types";

interface MapClusterJudgeState {
  judgesByClusterId: { [key: number]: Judge[] };
  judgeClusters: Record<number, Cluster>;
  isLoadingMapClusterJudge: boolean;
  cluster: Cluster | null;
  mapClusterJudgeError: string | null;

  fetchJudgesByClusterId: (clusterId: number, forceRefresh?: boolean) => Promise<void>;
  updateJudgeInCluster: (clusterId: number, updatedJudge: Judge) => void;
  updateJudgeInAllClusters: (updatedJudge: Judge) => void;
  addJudgeToCluster: (clusterId: number, judge: Judge) => void;
  fetchClusterByJudgeId: (judgeId: number) => Promise<void>;
  fetchClustersForJudges: (judges: Judge[]) => Promise<void>;
  fetchAllClustersByJudgeId: (judgeId: number) => Promise<Cluster[]>;
  createClusterJudgeMapping: (mapData: any) => Promise<void>;
  deleteClusterJudgeMapping: (
    mapId: number,
    clusterId: number
  ) => Promise<void>;
  removeJudgeFromContest: (judgeId: number, contestId: number) => Promise<void>;
  removeJudgeFromCluster: (judgeId: number, clusterId: number) => Promise<void>;
  clearJudgesByClusterId: () => void;
  clearCluster: () => void;
  clearJudgeClusters: () => void;
}

export const useMapClusterJudgeStore = create<MapClusterJudgeState>()(
  persist(
    (set, get) => ({
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

      fetchJudgesByClusterId: async (clusterId: number, forceRefresh: boolean = false) => {
        // Check cache first - if we already have judges for this cluster and not forcing refresh, return early
        if (!forceRefresh) {
          const cachedJudges = get().judgesByClusterId[clusterId];
          if (cachedJudges && cachedJudges.length > 0) {
            return; // Use cached data
          }
        }
        
        set({ isLoadingMapClusterJudge: true });
        try {
          const response = await api.get(
            `/api/mapping/clusterToJudge/getAllJudgesByCluster/${clusterId}/`
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

      updateJudgeInCluster: (clusterId: number, updatedJudge: Judge) => {
        set((state) => ({
          judgesByClusterId: {
            ...state.judgesByClusterId,
            [clusterId]: (state.judgesByClusterId[clusterId] || []).map((j) =>
              j.id === updatedJudge.id ? updatedJudge : j
            ),
          },
        }));
      },

      updateJudgeInAllClusters: (updatedJudge: Judge) => {
        set((state) => {
          const updatedJudgesByClusterId: { [key: number]: Judge[] } = {};
          Object.keys(state.judgesByClusterId).forEach((clusterIdStr) => {
            const clusterId = parseInt(clusterIdStr, 10);
            updatedJudgesByClusterId[clusterId] = (
              state.judgesByClusterId[clusterId] || []
            ).map((j) => {
              if (j.id === updatedJudge.id) {
                return {
                  ...j,
                  first_name: updatedJudge.first_name,
                  last_name: updatedJudge.last_name,
                  phone_number: updatedJudge.phone_number,
                  role: updatedJudge.role,
                };
              }
              return j;
            });
          });
          return { judgesByClusterId: updatedJudgesByClusterId };
        });
      },

      addJudgeToCluster: (clusterId: number, judge: Judge) => {
        set((state) => ({
          judgesByClusterId: {
            ...state.judgesByClusterId,
            [clusterId]: [...(state.judgesByClusterId[clusterId] || []), judge],
          },
        }));
      },

      fetchClusterByJudgeId: async (judgeId) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const response = await api.get(
            `/api/mapping/clusterToJudge/getClusterByJudge/${judgeId}/`
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
          await Promise.all(
            judges.map(async (judge) => {
              const response = await api.get(
                `/api/mapping/clusterToJudge/getClusterByJudge/${judge.id}/`
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

      fetchAllClustersByJudgeId: async (judgeId: number) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const response = await api.get(
            `/api/mapping/clusterToJudge/getAllClustersByJudge/${judgeId}/`
          );
          set({ mapClusterJudgeError: null });
          return response.data?.Clusters || [];
        } catch (error) {
          const errorMessage = "Error fetching all clusters for judge";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterJudge: false });
        }
      },

      createClusterJudgeMapping: async (mapData) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const response = await api.post(
            `/api/mapping/clusterToJudge/create/`,
            mapData
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
          await api.delete(`/api/mapping/clusterToJudge/delete/${mapId}/`);

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

      removeJudgeFromContest: async (judgeId: number, contestId: number) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          await api.delete(`/api/mapping/contestToJudge/remove/${judgeId}/${contestId}/`);
          set({ mapClusterJudgeError: null });
        } catch (error) {
          const errorMessage = "Error removing judge from contest";
          set({ mapClusterJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterJudge: false });
        }
      },

      removeJudgeFromCluster: async (judgeId: number, clusterId: number) => {
        set({ isLoadingMapClusterJudge: true });
        
        const originalState = get().judgesByClusterId[clusterId] || [];

        set((state) => ({
          judgesByClusterId: {
            ...state.judgesByClusterId,
            [clusterId]: (state.judgesByClusterId[clusterId] || []).filter(
              (judge) => judge.id !== judgeId
            ),
          },
          mapClusterJudgeError: null,
        }));
        
        try {
          await api.delete(`/api/mapping/clusterToJudge/remove/${judgeId}/${clusterId}/`);
      
          set({ mapClusterJudgeError: null });
        } catch (error) {
          set((state) => ({
            judgesByClusterId: {
              ...state.judgesByClusterId,
              [clusterId]: originalState,
            },
          }));
          await get().fetchJudgesByClusterId(clusterId, true);
          const errorMessage = "Error removing judge from cluster";
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
