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
    (set) => ({
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
          set({ clusters: response.data.Clusters });
          set({ mapClusterContestError: null });
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
        console.log('Store: fetchClustersForMultipleContests called with:', contestIds);
        set({ isLoadingMapClusterContest: true });
        try {
          const contestClustersMap: {[contestId: number]: Cluster[]} = {};
          
          for (const contestId of contestIds) {
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
              console.log(`Store: Fetched ${response.data.Clusters?.length || 0} clusters for contest ${contestId}`);
            } catch (error) {
              console.warn(`Failed to fetch clusters for contest ${contestId}`);
              contestClustersMap[contestId] = [];
            }
          }
          
          console.log('Store: Setting contestClusters to:', contestClustersMap);
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
