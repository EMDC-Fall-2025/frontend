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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/clusterToContest/getAllClustersByContest/${contestId}/`,
            { headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" } }
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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/clusterToTeam/getAllTeamsByCluster/${clusterId}/`,
            { headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" } }
          );
          const teams = response.data?.Teams || [];
          set((s) => ({
            teamsByClusterId: { ...s.teamsByClusterId, [clusterId]: teams },
            isLoadingMapClusterToTeam: false,
          }));
          return teams;
        } catch (error) {
          handleError(error, set, "Error fetching teams");
          throw error;
        }
      },

      createClusterTeamMapping: async (data) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(`/api/mapping/clusterToTeam/create/`, data, {
            headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
          });
          set((s) => ({
            clusterTeamMappings: [...s.clusterTeamMappings, response.data.mapping],
            isLoadingMapClusterToTeam: false,
          }));
        } catch (error) {
          handleError(error, set, "Error creating cluster-team mapping");
        }
      },

      deleteClusterTeamMapping: async (mapId, clusterId) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/mapping/clusterToTeam/delete/${mapId}/`, {
            headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
          });

          set((s) => ({
            clusterTeamMappings: s.clusterTeamMappings.filter((m) => m.id !== mapId),
            teamsByClusterId: clusterId
              ? {
                ...s.teamsByClusterId,
                [clusterId]: (s.teamsByClusterId[clusterId] || []).filter(
                  (team) => (team as any).map_id !== mapId
                ),
              }
              : s.teamsByClusterId,
            isLoadingMapClusterToTeam: false,
          }));
        } catch (error) {
          handleError(error, set, "Error deleting cluster-team mapping");
        }
      },

      deleteTeamCompletely: async (teamId) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/team/delete/${teamId}/`, {
            headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
          });

          // Remove from all clusters in local state
          set((s) => {
            const updated = Object.fromEntries(
              Object.entries(s.teamsByClusterId).map(([cid, teams]) => [
                Number(cid),
                teams.filter((t) => t.id !== teamId),
              ])
            );
            return { teamsByClusterId: updated, isLoadingMapClusterToTeam: false };
          });
        } catch (error) {
          handleError(error, set, "Error deleting team completely");
        }
      },

      //Add to cluster (auto-remove from old clusters to avoid duplicates)
      addTeamToCluster: (clusterId, team) => {
        const { removeTeamFromOtherClusters } = get();
        removeTeamFromOtherClusters(team.id, clusterId);
        set((s) => ({
          teamsByClusterId: {
            ...s.teamsByClusterId,
            [clusterId]: [...(s.teamsByClusterId[clusterId] || []), team],
          },
        }));
      },

      //Remove a team from all clusters except one
      removeTeamFromOtherClusters: (teamId, newClusterId) => {
        set((s) => {
          const updated = { ...s.teamsByClusterId };
          for (const [cid, teams] of Object.entries(updated)) {
            const num = Number(cid);
            if (num === newClusterId) continue;
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
        if (updatedTeam.cluster_id && updatedTeam.cluster_id !== clusterId) {
          moveTeamToNewCluster(clusterId, updatedTeam.cluster_id, updatedTeam);
          await Promise.all([
            fetchTeamsByClusterId(clusterId, true),
            fetchTeamsByClusterId(updatedTeam.cluster_id, true),
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
      partialize: (s) => ({ clusters: s.clusters }),
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
