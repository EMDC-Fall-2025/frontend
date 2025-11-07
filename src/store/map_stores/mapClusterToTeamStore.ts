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
  addTeamToCluster: (clusterId: number, team: Team) => void;
  updateTeamInCluster: (clusterId: number, updatedTeam: Team) => Promise<void>;
  removeTeamFromOtherClusters: (teamId: number, newClusterId: number) => void;
  moveTeamToNewCluster: (
    oldClusterId: number,
    newClusterId: number,
    updatedTeam: Team
  ) => void;

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

      fetchTeamsByClusterId: async (clusterId: number, forceRefresh = false) => {
        if (!forceRefresh) {
          const cached = get().teamsByClusterId[clusterId];
          if (cached?.length) return cached;
        }
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(
            `/api/mapping/clusterToTeam/getAllTeamsByCluster/${clusterId}/`,
            { headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" } }
          );
          const teams = res.data?.Teams || [];
          set((s) => ({
            teamsByClusterId: { ...s.teamsByClusterId, [clusterId]: teams },
            isLoadingMapClusterToTeam: false,
          }));
          return teams;
        } catch {
          set({ mapClusterToTeamError: "Error fetching teams", isLoadingMapClusterToTeam: false });
        }
      },

      createClusterTeamMapping: async (data) => {
        set({ isLoadingMapClusterToTeam: true, mapClusterToTeamError: null });
        try {
          const token = localStorage.getItem("token");
          const res = await axios.post(`/api/mapping/clusterToTeam/create/`, data, {
            headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
          });

          set((s) => ({
            clusterTeamMappings: [...s.clusterTeamMappings, res.data.mapping],
            isLoadingMapClusterToTeam: false,
          }));

          await get().fetchTeamsByClusterId(data.cluster_id, true);
        } catch (e) {
          handleError(e, set, "Error creating cluster-team mapping");
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
            isLoadingMapClusterToTeam: false,
          }));

          if (clusterId) {
            await get().fetchTeamsByClusterId(clusterId, true);
          }

        } catch (e) {
          handleError(e, set, "Error deleting cluster-team mapping");
        }
      },

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

      moveTeamToNewCluster: (oldClusterId, newClusterId, updatedTeam) => {
        set((s) => {
          const updated = { ...s.teamsByClusterId };
          if (updated[oldClusterId]) {
            updated[oldClusterId] = updated[oldClusterId].filter((t) => t.id !== updatedTeam.id);
          }
          const newTeams = updated[newClusterId] || [];
          updated[newClusterId] = [...newTeams.filter((t) => t.id !== updatedTeam.id), updatedTeam];
          return { teamsByClusterId: updated };
        });
      },

      updateTeamInCluster: async (clusterId, updatedTeam) => {
        const { moveTeamToNewCluster, fetchTeamsByClusterId } = get();

        if (updatedTeam.cluster_id && updatedTeam.cluster_id !== clusterId) {
          moveTeamToNewCluster(clusterId, updatedTeam.cluster_id, updatedTeam);
          await Promise.all([
            fetchTeamsByClusterId(clusterId, true),
            fetchTeamsByClusterId(updatedTeam.cluster_id, true),
          ]);
        } else {
          set((s) => ({
            teamsByClusterId: {
              ...s.teamsByClusterId,
              [clusterId]: (s.teamsByClusterId[clusterId] || []).map((t) =>
                t.id === updatedTeam.id ? updatedTeam : t
              ),
            },
          }));
          await fetchTeamsByClusterId(clusterId, true);
        }
      },

      deleteTeamCompletely: async (teamId: number) => {
        try {
          const token = localStorage.getItem("token");

          // Delete from backend
          await axios.delete(`/api/team/delete/${teamId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });

          // Instantly update local state so team disappears right away
          set((s) => {
            const updated = { ...s.teamsByClusterId };
            for (const [clusterId, teams] of Object.entries(updated)) {
              updated[Number(clusterId)] = teams.filter((t) => t.id !== teamId);
            }
            return { teamsByClusterId: updated };
          });

          // Trigger immediate UI refresh for Ranking pages
          window.dispatchEvent(new Event("refreshRankings"));
        } catch (error) {
          console.error("Error deleting team:", error);
          set({ mapClusterToTeamError: "Error deleting team" });
        }
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
