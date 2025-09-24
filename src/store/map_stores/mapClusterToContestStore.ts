import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Cluster } from "../../types";

interface MapClusterContestState {
  clusters: Cluster[];
  isLoadingMapClusterContest: boolean;
  mapClusterContestError: string | null;
  fetchClustersByContestId: (contestId: number) => Promise<void>;
  clearClusters: () => void;
}

export const useMapClusterToContestStore = create<MapClusterContestState>()(
  persist(
    (set) => ({
      clusters: [],
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
          console.log('Cluster store: Fetching clusters for contest:', contestId);
          const response = await api.get(`/mapping/clusterToContest/getAllClustersByContest/${contestId}/`);
          console.log('Cluster store: Response received:', response.data);
          set({ clusters: response.data.Clusters });
          set({ mapClusterContestError: null });
        } catch (mapClusterContestError: any) {
          console.error('Cluster store: Error fetching clusters:', mapClusterContestError);
          const errorMessage = "Failed to fetch clusters";
          set({ mapClusterContestError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingMapClusterContest: false });
        }
      },
    }),
    {
      name: "map-cluster-contest-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);