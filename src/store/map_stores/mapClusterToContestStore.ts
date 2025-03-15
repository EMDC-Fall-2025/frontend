import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/clusterToContest/getAllClustersByContest/${contestId}/`,
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
    }),
    {
      name: "map-cluster-contest-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
