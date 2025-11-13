import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Cluster, Team, ClusterTeamMapping } from "../../types";

interface MapClusterTeamState {
  clusters: Cluster[];
  teamsByClusterId: { [key: number]: Team[] };
  clusterTeamMappings: ClusterTeamMapping[];
  isLoadingMapClusterToTeam: boolean;
  mapClusterToTeamError: string | null;

  fetchClustersByContestId: (contestId: number) => Promise<void>;
  fetchTeamsByClusterId: (clusterId: number, forceRefresh?: boolean) => Promise<Team[]>;
  fetchTeamsByJudgeId: (judgeId: number, forceRefresh?: boolean) => Promise<Team[]>;
  createClusterTeamMapping: (data: ClusterTeamMapping) => Promise<void>;
  deleteClusterTeamMapping: (mapId: number, clusterId?: number) => Promise<void>;
  deleteTeamCompletely: (teamId: number) => Promise<void>;
  addTeamToCluster: (clusterId: number, team: Team) => void;
  updateTeamInCluster: (clusterId: number, updatedTeam: Team) => void;
  updateTeamInAllClusters: (teamId: number, updatedTeam: Team) => void;
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
          const response = await api.get(
            `/api/mapping/clusterToContest/getAllClustersByContest/${contestId}/`
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
          const response = await api.get(
            `/api/mapping/clusterToTeam/getAllTeamsByCluster/${clusterId}/`
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

      fetchTeamsByJudgeId: async (judgeId: number, forceRefresh: boolean = false) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const response = await api.get(
            `/api/mapping/clusterToTeam/getTeamsByJudge/${judgeId}/`
          );
          const teams = response.data?.Teams || [];
          set({ isLoadingMapClusterToTeam: false, mapClusterToTeamError: null });
          return teams;
        } catch (error) {
          const errorMessage = "Error fetching teams by judge";
          set({ mapClusterToTeamError: errorMessage, isLoadingMapClusterToTeam: false });
          throw new Error(errorMessage);
        }
      },

      createClusterTeamMapping: async (data: ClusterTeamMapping) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const response = await api.post(
            `/api/mapping/clusterToTeam/create/`,
            data
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

      deleteClusterTeamMapping: async (mapId: number, clusterId?: number) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          await api.delete(`/api/mapping/clusterToTeam/delete/${mapId}/`);
          set((state) => ({
            clusterTeamMappings: state.clusterTeamMappings.filter(
              (mapping) => mapping.id !== mapId
            ),
          
            // Find the team with matching map_id and remove it
            teamsByClusterId: clusterId
              ? {
                  ...state.teamsByClusterId,
                  [clusterId]: (state.teamsByClusterId[clusterId] || []).filter(
                    (team) => (team as any).map_id !== mapId
                  ),
                }
              : state.teamsByClusterId,
            isLoadingMapClusterToTeam: false,
          }));
        } catch (error) {
          handleError(error, set, "Error deleting cluster-team mapping");
        }
      },

      deleteTeamCompletely: async (teamId: number) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          await api.delete(`/api/team/delete/${teamId}/`);
          // Remove team from all clusters in UI state
          set((state) => {
            const updatedTeamsByClusterId: { [key: number]: Team[] } = {};
            Object.keys(state.teamsByClusterId).forEach((clusterId) => {
              updatedTeamsByClusterId[Number(clusterId)] = (
                state.teamsByClusterId[Number(clusterId)] || []
              ).filter((team) => team.id !== teamId);
            });
            return {
              teamsByClusterId: updatedTeamsByClusterId,
              isLoadingMapClusterToTeam: false,
              mapClusterToTeamError: null,
            };
          });
        } catch (error) {
          handleError(error, set, "Error deleting team completely");
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

      updateTeamInAllClusters: (teamId: number, updatedTeam: Team) => {
        set((state) => {
          const updatedTeamsByClusterId: { [key: number]: Team[] } = {};
          let hasChanges = false;
          
          // Update team in all clusters where it appears
          Object.keys(state.teamsByClusterId).forEach((clusterIdStr) => {
            const clusterId = parseInt(clusterIdStr);
            const teams = state.teamsByClusterId[clusterId];
            if (teams && Array.isArray(teams)) {
              const teamIndex = teams.findIndex((t: Team) => t.id === teamId);
              if (teamIndex !== -1) {
                const updatedTeams = [...teams];
                updatedTeams[teamIndex] = updatedTeam;
                updatedTeamsByClusterId[clusterId] = updatedTeams;
                hasChanges = true;
              }
            }
          });
          
          // Always return a new state object to ensure Zustand detects the change
          return {
            ...state,
            teamsByClusterId: hasChanges
              ? {
                  ...state.teamsByClusterId,
                  ...updatedTeamsByClusterId,
                }
              : state.teamsByClusterId,
          };
        });
      },
    }),
    {
      name: "map-cluster-team-storage",
      storage: createJSONStorage(() => localStorage),
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
