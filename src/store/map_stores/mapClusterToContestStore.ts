import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Cluster } from "../../types";

interface MapClusterContestState {
  clusters: Cluster[];
  contestClusters: {[contestId: number]: Cluster[]};
  isLoadingMapClusterContest: boolean;
  mapClusterContestError: string | null;
  fetchClustersByContestId: (contestId: number) => Promise<void>;
  clearClusters: () => void;
  clearContestClusters: () => Promise<void>;
  fetchClustersForMultipleContests: (contestIds: number[]) => Promise<void>;
}

export const useMapClusterToContestStore = create<MapClusterContestState>()(
  persist(
    (set, get) => ({
      clusters: [],
      contestClusters: {},
      isLoadingMapClusterContest: false,
      mapClusterContestError: null,

      clearClusters: async () => {
        try {
          set({ clusters: [] });
          set({ mapClusterContestError: null });
        } catch (mapClusterContestError) {
          const errorMessage = "Error clearing out clusters in state";
          set({ mapClusterContestError: errorMessage });
          throw Error(errorMessage);
        }
      },

      fetchClustersByContestId: async (contestId: number) => {
        // Check cache first - if we already have clusters for this contest, return early
        const cachedClusters = get().contestClusters[contestId];
        if (cachedClusters && cachedClusters.length > 0) {
          set({ clusters: cachedClusters });
          return cachedClusters; // Use cached data
        }
        
        set({ isLoadingMapClusterContest: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/clusterToContest/getAllClustersByContest/${contestId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          // Ensure cluster_type is present and normalized
          const clusters = (response.data.Clusters || []).map((c: any) => ({
            ...c,
            cluster_type: (c.cluster_type ?? "preliminary").toLowerCase(),
          }));
          set({ 
            clusters,
            contestClusters: {
              ...get().contestClusters,
              [contestId]: clusters,
            }
          });
          set({ mapClusterContestError: null });
          return clusters; // Return the clusters for immediate use
        } catch (mapClusterContestError: any) {
          const errorMessage = "Failed to fetch clusters";
          set({ mapClusterContestError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterContest: false });
        }
      },

      clearContestClusters: async () => {
        try {
          set({ contestClusters: {} });
          set({ mapClusterContestError: null });
        } catch (error) {
          const errorMessage = "Error clearing contest clusters";
          set({ mapClusterContestError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      fetchClustersForMultipleContests: async (contestIds: number[]) => {
        // Check cache first - only fetch for contests we don't have data for
        const cachedContestClusters = get().contestClusters;
        const contestClustersMap: {[contestId: number]: Cluster[]} = { ...cachedContestClusters };
        const contestsToFetch = contestIds.filter(id => !cachedContestClusters[id] || cachedContestClusters[id].length === 0);
        
        // If all contests are cached, return early
        if (contestsToFetch.length === 0) {
          return; // Use cached data
        }
        
        set({ isLoadingMapClusterContest: true });
        try {
          for (const contestId of contestsToFetch) {
            try {
              const token = localStorage.getItem("token");
              const response = await axios.get(
                `/api/mapping/clusterToContest/getAllClustersByContest/${contestId}/`,
                {
                  headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              contestClustersMap[contestId] = response.data.Clusters || [];
            } catch (error) {
              console.warn(`Failed to fetch clusters for contest ${contestId}`);
              contestClustersMap[contestId] = [];
            }
          }
          
          set({ 
            contestClusters: contestClustersMap,
            mapClusterContestError: null,
            isLoadingMapClusterContest: false,
          });
        } catch (error) {
          const errorMessage = "Error fetching clusters for multiple contests";
          set({ 
            mapClusterContestError: errorMessage,
            isLoadingMapClusterContest: false,
          });
          throw new Error(errorMessage);
        }
      },
    }),
    {
      name: "map-cluster-contest-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
