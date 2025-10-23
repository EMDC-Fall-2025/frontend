import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Cluster, Team, ClusterTeamMapping } from "../../types";

interface MapClusterTeamState {
  clusters: Cluster[];
  teamsByClusterId: { [key: number]: Team[] };
  clusterTeamMappings: ClusterTeamMapping[];
  isLoadingMapClusterToTeam: boolean;
  mapClusterToTeamError: string | null;

  fetchClustersByContestId: (contestId: number) => Promise<void>;
  getTeamsByClusterId: (clusterId: number) => Promise<void>;
  createClusterTeamMapping: (data: ClusterTeamMapping) => Promise<void>;
  deleteClusterTeamMapping: (mapId: number) => Promise<void>;
  clearClusters: () => void;
  clearTeamsByClusterId: () => void;
  clearClusterTeamMappings: () => void;
}

const useMapClusterTeamStore = create<MapClusterTeamState>()(
  persist(
    (set) => ({
      clusters: [],
      teamsByClusterId: {},
      clusterTeamMappings: [],
      isLoadingMapClusterToTeam: false,
      mapClusterToTeamError: null,

      clearClusters: () => set({ clusters: [], mapClusterToTeamError: null }),
      clearTeamsByClusterId: () =>
        set({ teamsByClusterId: {}, mapClusterToTeamError: null }),
      clearClusterTeamMappings: () =>
        set({ clusterTeamMappings: [], mapClusterToTeamError: null }),

      fetchClustersByContestId: async (contestId) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
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
          console.log('API Response for clusters:', response.data);
          console.log('Clusters from API:', response.data.Clusters);
          set({ clusters: response.data.Clusters, isLoadingMapClusterToTeam: false });
        } catch (error) {
          handleError(error, set, "Error fetching clusters");
        }
      },

      getTeamsByClusterId: async (clusterId) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/clusterToTeam/getAllTeamsByCluster/${clusterId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set((state) => ({
            teamsByClusterId: {
              ...state.teamsByClusterId,
              [clusterId]: response.data.Teams,
            },
            isLoadingMapClusterToTeam: false,
          }));
        } catch (error) {
          handleError(error, set, "Error fetching teams by cluster");
        }
      },

      createClusterTeamMapping: async (data: ClusterTeamMapping) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/mapping/clusterToTeam/create/`,
            data,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set((state) => ({
            clusterTeamMappings: [
              ...state.clusterTeamMappings,
              response.data.mapping,
            ],
            isLoadingMapClusterToTeam: false,
          }));
        } catch (error) {
          handleError(error, set, "Error creating cluster-team mapping");
        }
      },

      deleteClusterTeamMapping: async (mapId: number) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/mapping/clusterToTeam/delete/${mapId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set((state) => ({
            clusterTeamMappings: state.clusterTeamMappings.filter(
              (mapping) => mapping.id !== mapId
            ),
            isLoadingMapClusterToTeam: false,
          }));
        } catch (error) {
          handleError(error, set, "Error deleting cluster-team mapping");
        }
      },
    }),
    {
      name: "map-cluster-team-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

const handleError = (error: any, set: any, defaultMessage: string) => {
  set({
    mapClusterToTeamError: error.response?.data?.detail || defaultMessage,
    isLoadingMapClusterToTeam: false,
  });
};

export default useMapClusterTeamStore;
