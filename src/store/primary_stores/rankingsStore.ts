import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Contest, Cluster } from "../../types";
import { dispatchDataChange } from "../../utils/dataChangeEvents";

interface RankingsState {
  contests: Contest[];
  clusters: Cluster[];
  selectedContest: Contest | null;
  isLoadingRankings: boolean;
  rankingsError: string | null;
  
  fetchContestsForOrganizer: (organizerId: number) => Promise<void>;
  fetchClustersWithTeamsForContest: (contestId: number) => Promise<void>;
  setSelectedContest: (contest: Contest | null) => void;
  clearRankings: () => void;
  advanceToChampionship: (contestId: number, championshipTeamIds: number[]) => Promise<void>;
  undoChampionshipAdvancement: (contestId: number) => Promise<void>;
  listAdvancers: (contestId: number) => Promise<any>;
}

export const useRankingsStore = create<RankingsState>()(
  persist(
    (set) => ({
      contests: [],
      clusters: [],
      selectedContest: null,
      isLoadingRankings: false,
      rankingsError: null,

      clearRankings: () => {
        set({ 
          contests: [], 
          clusters: [], 
          selectedContest: null,
          rankingsError: null 
        });
      },

      setSelectedContest: (contest: Contest | null) => {
        set({ selectedContest: contest });
      },

      fetchContestsForOrganizer: async (organizerId: number) => {
        set({ isLoadingRankings: true, rankingsError: null });
        try {
          const response = await api.get(
            `/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`
          );
          const contestsData = response.data?.Contests ?? [];
          set({ 
            contests: contestsData,
            selectedContest: contestsData.length > 0 ? contestsData[0] : null,
            isLoadingRankings: false 
          });
        } catch (error) {
          const errorMessage = "Failed to load contests";
          set({ 
            rankingsError: errorMessage,
            isLoadingRankings: false 
          });
          throw new Error(errorMessage);
        }
      },

      fetchClustersWithTeamsForContest: async (contestId: number) => {
        set({ isLoadingRankings: true, rankingsError: null });
        try {
          // Fetch clusters for the contest
          const clusterResponse = await api.get(
            `/api/mapping/clusterToContest/getAllClustersByContest/${contestId}/`
          );
          
          const clusterData = (clusterResponse.data?.Clusters ?? []).map((c: any) => ({ 
            id: c.id, 
            cluster_name: c.cluster_name ?? c.name, 
            cluster_type: c.cluster_type,
            teams: [] 
          }));

          // Fetch teams for each cluster and calculate rankings
          const clustersWithTeams = await Promise.all(
            clusterData.map(async (cluster: any) => {
              try {
                const teamResponse = await api.get(
                  `/api/mapping/clusterToTeam/getAllTeamsByCluster/${cluster.id}/`
                );
                
                
                const teams = (teamResponse.data?.Teams ?? []).map((t: any) => ({ 
                  id: t.id, 
                  team_name: t.team_name ?? t.name, 
                  school_name: t.school_name ?? 'N/A', 
                  total_score: cluster.cluster_type === 'preliminary' ? (t.preliminary_total_score ?? 0) : (t.total_score ?? 0),
                  advanced_to_championship: t.advanced_to_championship ?? false
                }));

                // Sort teams by score and assign ranks
                const rankedTeams = teams
                  .sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0))
                  .map((t: any, i: number) => ({ ...t, cluster_rank: i + 1 }));
                
                

                // Fetch submission status for each team
                const teamsWithStatus = await Promise.all(
                  rankedTeams.map(async (t: any) => {
                    try {
                      const statusResponse = await api.get(
                        `/api/mapping/scoreSheet/allSubmittedForTeam/${t.id}/`
                      );
                      const total = t.total_score ?? 0;
                      const status = (statusResponse.data?.allSubmitted && total > 0)
                        ? 'completed'
                        : ((statusResponse.data?.submittedCount > 0 || total > 0) ? 'in_progress' : 'not_started');
                      return { ...t, status };
                    } catch {
                      return { ...t, status: 'not_started' as const };
                    }
                  })
                );

                return { ...cluster, teams: teamsWithStatus };
              } catch {
                return { ...cluster, teams: [] };
              }
            })
          );

          
          set({ 
            clusters: clustersWithTeams,
            isLoadingRankings: false 
          });
        } catch (error) {
          const errorMessage = "Failed to load contest data";
          set({ 
            rankingsError: errorMessage,
            isLoadingRankings: false 
          });
          throw new Error(errorMessage);
        }
      },

      advanceToChampionship: async (contestId: number, championshipTeamIds: number[]) => {
        set({ isLoadingRankings: true, rankingsError: null });
        try {
          const requestData = {
            contestid: contestId,
            championship_team_ids: championshipTeamIds
          };
          
          const response = await api.post(
            `/api/advance/advanceToChampionship/`,
            requestData
          );
          
          if (response.data.ok) {
            // Refresh the clusters to show the new championship/redesign clusters
            const { fetchClustersWithTeamsForContest } = useRankingsStore.getState();
            await fetchClustersWithTeamsForContest(contestId);

            // Dispatch data change events for all advanced teams
            championshipTeamIds.forEach(teamId => {
              dispatchDataChange({
                type: 'team',
                action: 'update',
                id: teamId,
                contestId: contestId
              });
            });

            // Dispatch cluster update event to trigger judge and team refreshes
            dispatchDataChange({
              type: 'cluster',
              action: 'update',
              contestId: contestId
            });

            // Dispatch scoresheet update event to invalidate scoresheet cache
            dispatchDataChange({
              type: 'scoresheet',
              action: 'create',
              contestId: contestId
            });

            // Dispatch judge update event to refresh judge data
            // (judge championship/redesign flags may have been updated)
            dispatchDataChange({
              type: 'judge',
              action: 'update',
              contestId: contestId
            });
          } else {
            throw new Error(response.data.message || "Failed to advance to championship");
          }
        } catch (error: any) {
          console.error('Error advancing to championship:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
          
          const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to advance to championship";
          set({ 
            rankingsError: errorMessage,
            isLoadingRankings: false 
          });
          throw new Error(errorMessage);
        }
      },

      undoChampionshipAdvancement: async (contestId: number) => {
        set({ isLoadingRankings: true, rankingsError: null });
        try {
          const response = await api.post(
            `/api/advance/undoChampionshipAdvancement/`,
            {
              contestid: contestId,
            }
          );
          
          if (response.data.ok) {
            // Refresh the clusters to show the reverted state
            const { fetchClustersWithTeamsForContest } = useRankingsStore.getState();
            await fetchClustersWithTeamsForContest(contestId);

            // Dispatch data change events to notify all components to refresh
            dispatchDataChange({
              type: 'team',
              action: 'update',
              contestId: contestId
            });

            dispatchDataChange({
              type: 'cluster',
              action: 'update',
              contestId: contestId
            });

            dispatchDataChange({
              type: 'scoresheet',
              action: 'delete',
              contestId: contestId
            });

            dispatchDataChange({
              type: 'judge',
              action: 'update',
              contestId: contestId
            });

            // Dispatch the championshipUndone event that Judging.tsx listens for
            window.dispatchEvent(new CustomEvent('championshipUndone'));
          } else {
            throw new Error(response.data.message || "Failed to undo championship advancement");
          }
        } catch (error) {
          const errorMessage = "Failed to undo championship advancement";
          set({ 
            rankingsError: errorMessage,
            isLoadingRankings: false 
          });
          throw new Error(errorMessage);
        }
      },

      listAdvancers: async (contestId: number) => {
        set({ isLoadingRankings: true, rankingsError: null });
        try {
          const response = await api.get(
            `/api/tabulation/listAdvancers/?contestid=${contestId}`
          );
          
          if (response.data.ok) {
            return response.data;
          } else {
            throw new Error(response.data.message || "Failed to list advancers");
          }
        } catch (error: any) {
          console.error('Error listing advancers:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
          
          const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to list advancers";
          set({ 
            rankingsError: errorMessage,
            isLoadingRankings: false 
          });
          throw new Error(errorMessage);
        }
      },
    }),
    {
      name: "rankings-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useRankingsStore;