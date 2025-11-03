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

  fetchJudgesByClusterId: (clusterId: number, forceRefresh?: boolean) => Promise<void>;
  updateJudgeInCluster: (clusterId: number, updatedJudge: Judge) => void;
  updateJudgeInAllClusters: (updatedJudge: Judge, newClusterId?: number) => void;
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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/clusterToJudge/getAllJudgesByCluster/${clusterId}/`,
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

      updateJudgeInAllClusters: (updatedJudge: Judge, newClusterId?: number) => {
        set((state) => {
          const updatedJudgesByClusterId: { [key: number]: Judge[] } = {};
          
          // Process all existing clusters
          Object.keys(state.judgesByClusterId).forEach((clusterIdStr) => {
            const clusterId = parseInt(clusterIdStr, 10);
            const judgesInCluster = state.judgesByClusterId[clusterId] || [];
            
            // If moving to a new cluster, remove from all other clusters
            if (newClusterId !== undefined && clusterId !== newClusterId) {
              updatedJudgesByClusterId[clusterId] = judgesInCluster.filter(
                (j) => j.id !== updatedJudge.id
              );
              return;
            }
            
            // Update or add judge in this cluster
            const judgeIndex = judgesInCluster.findIndex((j) => j.id === updatedJudge.id);
            
            if (judgeIndex !== -1) {
              // Judge exists - update all fields if cluster specified, otherwise just name fields
              updatedJudgesByClusterId[clusterId] = judgesInCluster.map((j) => {
                if (j.id === updatedJudge.id) {
                  return newClusterId !== undefined ? updatedJudge : {
                    ...j,
                    first_name: updatedJudge.first_name,
                    last_name: updatedJudge.last_name,
                    phone_number: updatedJudge.phone_number,
                    role: updatedJudge.role,
                  };
                }
                return j;
              });
            } else if (newClusterId !== undefined && clusterId === newClusterId) {
              // Judge doesn't exist but this is the new cluster - add it
              updatedJudgesByClusterId[clusterId] = [...judgesInCluster, updatedJudge];
            } else {
              // Judge doesn't exist and not the new cluster - keep as is
              updatedJudgesByClusterId[clusterId] = judgesInCluster;
            }
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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/clusterToJudge/getClusterByJudge/${judgeId}/`,
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
                `/api/mapping/clusterToJudge/getClusterByJudge/${judge.id}/`,
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

      fetchAllClustersByJudgeId: async (judgeId: number) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/clusterToJudge/getAllClustersByJudge/${judgeId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
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
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/mapping/clusterToJudge/create/`,
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
          await axios.delete(`/api/mapping/clusterToJudge/delete/${mapId}/`, {
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

      removeJudgeFromContest: async (judgeId: number, contestId: number) => {
        set({ isLoadingMapClusterJudge: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/mapping/contestToJudge/remove/${judgeId}/${contestId}/`, {
            headers: { Authorization: `Token ${token}` },
          });
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
          const token = localStorage.getItem("token");
          await axios.delete(`/api/mapping/clusterToJudge/remove/${judgeId}/${clusterId}/`, {
            headers: { Authorization: `Token ${token}` },
          });
      
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
