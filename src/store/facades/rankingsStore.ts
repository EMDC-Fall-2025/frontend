import { create } from "zustand";
import { api } from "../../lib/api";
import { useAuthStore } from "../primary_stores/authStore";
import { useMapContestOrganizerStore } from "../map_stores/mapContestToOrganizerStore";
import { useMapClusterToContestStore } from "../map_stores/mapClusterToContestStore";
import useMapClusterTeamStore from "../map_stores/mapClusterToTeamStore";

type Contest = { id: number; contest_name?: string; name?: string };
type Cluster = { id: number; cluster_name: string; teams?: Team[] };
type Team = {
  id: number;
  team_name: string;
  total_score: number;
  cluster_rank?: number;
  status?: "not_started" | "in_progress" | "completed";
};

type RankingsState = {
  isLoading: boolean;
  error: string | null;
  contests: Contest[];
  clusters: Cluster[];
  loadOrganizerContests: () => Promise<void>;
  loadRankings: (contestId: number) => Promise<void>;
  clear: () => void;
};

export const useRankingsFacade = create<RankingsState>((set) => ({
  isLoading: false,
  error: null,
  contests: [],
  clusters: [],

  clear: async () => set({ contests: [], clusters: [], error: null }),

  loadOrganizerContests: async () => {
    set({ isLoading: true, error: null });
    try {
      const { role } = useAuthStore.getState();
      const organizerId = role?.user?.id;
      if (!organizerId) throw new Error("Organizer ID not found");

      // Reuse existing store to fetch
      const mapContestOrg = useMapContestOrganizerStore.getState();
      await mapContestOrg.fetchContestsByOrganizerId(organizerId);
      set({ contests: mapContestOrg.contests });
    } catch (e: any) {
      set({ error: e?.message || "Failed to load contests" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadRankings: async (contestId: number) => {
    set({ isLoading: true, error: null, clusters: [] });
    try {
      // 1) clusters by contest
      const mapClusterContest = useMapClusterToContestStore.getState();
      await mapClusterContest.fetchClustersByContestId(contestId);
      const clusters = mapClusterContest.clusters as Cluster[];

      // 2) teams per cluster (parallel) and rank
      const clusterTeamStore = useMapClusterTeamStore.getState();
      const clustersWithTeams = await Promise.all(
        clusters.map(async (c) => {
          await clusterTeamStore.getTeamsByClusterId(c.id);
          const teamsRaw = (useMapClusterTeamStore.getState().teamsByClusterId[c.id] || []) as Team[];
          const ranked = teamsRaw
            .slice()
            .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
            .map((t, i) => ({ ...t, cluster_rank: i + 1 }));
          return { ...c, teams: ranked } as Cluster;
        })
      );


      set({ clusters: clustersWithTeams, isLoading: false });

      // 3) per-team submission status (zero-score rule) in background
      Promise.all(
        clustersWithTeams.map(async (c) => {
          const teamsWithStatus: Team[] = await Promise.all(
            (c.teams || []).map(async (t) => {
              try {
                const { data: s } = await api.get(`/mapping/scoreSheet/allSubmittedForTeam/${t.id}/`);
                const total = t.total_score ?? 0;
                const status: Team["status"] = (s.allSubmitted && total > 0)
                  ? "completed"
                  : ((s.submittedCount > 0 || total > 0) ? "in_progress" : "not_started");
                return { ...t, status } as Team;
              } catch {
                return { ...t, status: "not_started" as Team["status"] } as Team;
              }
            })
          );
          return { ...c, teams: teamsWithStatus } as Cluster;
        })
      ).then((updated) => set({ clusters: updated }));
    } catch (e: any) {
      set({ error: e?.message || "Failed to load rankings", isLoading: false });
    }
  },
}));

export default useRankingsFacade;


