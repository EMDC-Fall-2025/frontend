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
  fetchTeamsByClusterId: (clusterId: number, forceRefresh?: boolean) => Promise<Team[]>;
  createClusterTeamMapping: (data: ClusterTeamMapping) => Promise<void>;
  deleteClusterTeamMapping: (mapId: number) => Promise<void>;
  addTeamToCluster: (clusterId: number, team: Team) => void;
  updateTeamInCluster: (clusterId: number, updatedTeam: Team) => void;
  clearClusters: () => void;
  clearTeamsByClusterId: () => void;
  clearClusterTeamMappings: () => void;
}

const useMapClusterTeamStore = create<MapClusterTeamState>()(
  persist(
    (set, get) => ({
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
          set({ clusters: response.data.Clusters, isLoadingMapClusterToTeam: false });
        } catch (error) {
          handleError(error, set, "Error fetching clusters");
        }
      },

      fetchTeamsByClusterId: async (clusterId: number, forceRefresh: boolean = false) => {
        // Check cache first - if we already have teams for this cluster and not forcing refresh, return early
        if (!forceRefresh) {
          const cachedTeams = get().teamsByClusterId[clusterId];
          if (cachedTeams && cachedTeams.length > 0) {
            return cachedTeams; // Use cached data - no API call, no re-render
          }
        }
        
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
          const teams = response.data?.Teams || [];
          // Update store state with fetched teams
          set((state) => ({
            teamsByClusterId: {
              ...state.teamsByClusterId,
              [clusterId]: teams,
            },
            isLoadingMapClusterToTeam: false,
            mapClusterToTeamError: null,
          }));
          return teams;
        } catch (error) {
          const errorMessage = "Error fetching teams by cluster";
          set({ mapClusterToTeamError: errorMessage, isLoadingMapClusterToTeam: false });
          throw new Error(errorMessage);
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

      addTeamToCluster: (clusterId: number, team: Team) => {
        set((state) => ({
          teamsByClusterId: {
            ...state.teamsByClusterId,
            [clusterId]: [...(state.teamsByClusterId[clusterId] || []), team],
          },
        }));
      },

      updateTeamInCluster: (clusterId: number, updatedTeam: Team) => {
        set((state) => ({
          teamsByClusterId: {
            ...state.teamsByClusterId,
            [clusterId]: (state.teamsByClusterId[clusterId] || []).map((t) =>
              t.id === updatedTeam.id ? updatedTeam : t
            ),
          },
        }));
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
