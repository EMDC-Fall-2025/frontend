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
  fetchTeamsByJudgeId: (judgeId: number) => Promise<Team[]>;
  createClusterTeamMapping: (data: ClusterTeamMapping) => Promise<void>;
  deleteClusterTeamMapping: (mapId: number, clusterId?: number) => Promise<void>;
  deleteTeamCompletely: (teamId: number) => Promise<void>;
  addTeamToCluster: (clusterId: number, team: Team) => void;
  updateTeamInCluster: (clusterId: number, updatedTeam: Team) => Promise<void>;
  removeTeamFromOtherClusters: (teamId: number, newClusterId: number) => void;
  moveTeamToNewCluster: (oldClusterId: number, newClusterId: number, updatedTeam: Team) => void;
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
      clearTeamsByClusterId: () => set({ teamsByClusterId: {}, mapClusterToTeamError: null }),
      clearClusterTeamMappings: () => set({ clusterTeamMappings: [], mapClusterToTeamError: null }),

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

      fetchTeamsByClusterId: async (clusterId, forceRefresh = false) => {
        if (!forceRefresh) {
          const cachedTeams = get().teamsByClusterId[clusterId];
          if (cachedTeams?.length) return cachedTeams;
        }

        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const response = await api.get(
            `/api/mapping/clusterToTeam/getAllTeamsByCluster/${clusterId}/`
          );
          const teams = response.data?.Teams || [];
          set((s) => ({
            teamsByClusterId: { ...s.teamsByClusterId, [clusterId]: teams },
            isLoadingMapClusterToTeam: false,
          }));
          return teams;
        } catch (error) {
          const errorMessage = "Error fetching teams by cluster";
          set({ mapClusterToTeamError: errorMessage, isLoadingMapClusterToTeam: false });
          throw new Error(errorMessage);
        }
      },

      fetchTeamsByJudgeId: async (judgeId: number) => {
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

      deleteClusterTeamMapping: async (mapId, clusterId) => {
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

      deleteTeamCompletely: async (teamId) => {
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
          throw error; // Re-throw so the component can catch it
        }
      },

      // Add to cluster: keep "All Teams" membership intact
      addTeamToCluster: (clusterId, team) => {
        const allTeams = get().clusters.find((c) => c.cluster_name === "All Teams");
        const allTeamsId = allTeams?.id;

        // If adding to "All Teams", do not remove from other clusters
        if (allTeamsId && clusterId === allTeamsId) {
          set((s) => ({
            teamsByClusterId: {
              ...s.teamsByClusterId,
              [clusterId]: (s.teamsByClusterId[clusterId] || []).some((t) => t.id === team.id)
                ? s.teamsByClusterId[clusterId]
                : [...(s.teamsByClusterId[clusterId] || []), team],
            },
          }));
          return;
        }

        // For specific clusters, remove from other clusters but keep "All Teams"
        const { removeTeamFromOtherClusters } = get();
        removeTeamFromOtherClusters(team.id, clusterId);

        set((s) => ({
          teamsByClusterId: {
            ...s.teamsByClusterId,
            [clusterId]: (s.teamsByClusterId[clusterId] || []).some((t) => t.id === team.id)
              ? s.teamsByClusterId[clusterId]
              : [...(s.teamsByClusterId[clusterId] || []), team],
          },
        }));
      },

      // Remove a team from all clusters except the new one, and keep "All Teams"
      removeTeamFromOtherClusters: (teamId, newClusterId) => {
        const allTeams = get().clusters.find((c) => c.cluster_name === "All Teams");
        const allTeamsId = allTeams?.id;
        set((s) => {
          const updated = { ...s.teamsByClusterId };
          for (const [cid, teams] of Object.entries(updated)) {
            const num = Number(cid);
            if (num === newClusterId) continue;
            if (allTeamsId && num === allTeamsId) continue; // retain in "All Teams"
            updated[num] = teams.filter((t) => t.id !== teamId);
          }
          return { teamsByClusterId: updated };
        });
      },

      //Move team between clusters instantly
      moveTeamToNewCluster: (oldClusterId, newClusterId, updatedTeam) => {
        set((s) => {
          const updated = { ...s.teamsByClusterId };
          if (updated[oldClusterId]) {
            updated[oldClusterId] = updated[oldClusterId].filter(
              (t) => t.id !== updatedTeam.id
            );
          }
          const newTeams = updated[newClusterId] || [];
          updated[newClusterId] = [...newTeams.filter((t) => t.id !== updatedTeam.id), updatedTeam];
          return { teamsByClusterId: updated };
        });
      },

      //Update and handle cluster switching instantly
      updateTeamInCluster: async (clusterId, updatedTeam) => {
        const { moveTeamToNewCluster, fetchTeamsByClusterId } = get();

        // instant UI update
        set((s) => ({
          teamsByClusterId: {
            ...s.teamsByClusterId,
            [clusterId]: (s.teamsByClusterId[clusterId] || []).map((t) =>
              t.id === updatedTeam.id ? updatedTeam : t
            ),
          },
        }));

        // handle if cluster changed
        if (updatedTeam.judge_cluster && updatedTeam.judge_cluster !== clusterId) {
          moveTeamToNewCluster(clusterId, updatedTeam.judge_cluster, updatedTeam);
          await Promise.all([
            fetchTeamsByClusterId(clusterId, true),
            fetchTeamsByClusterId(updatedTeam.judge_cluster, true),
          ]);
        } else {
          await fetchTeamsByClusterId(clusterId, true);
        }
      },

      //Update team across all clusters 
      updateTeamInAllClusters: (teamId, updatedTeam) => {
        set((s) => {
          const updatedTeamsByClusterId: { [key: number]: Team[] } = {};
          for (const [cid, teams] of Object.entries(s.teamsByClusterId)) {
            const id = Number(cid);
            updatedTeamsByClusterId[id] = teams.map((t) =>
              t.id === teamId ? updatedTeam : t
            );
          }
          return { teamsByClusterId: updatedTeamsByClusterId };
        });
      },
    }),
    {
      name: "map-cluster-team-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

const handleError = (error: any, set: any, msg: string) => {
  set({
    mapClusterToTeamError: error.response?.data?.detail || msg,
    isLoadingMapClusterToTeam: false,
  });
};

export default useMapClusterTeamStore;
