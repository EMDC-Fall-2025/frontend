import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Contest, Cluster } from "../../types";

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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`,
            {
              headers: { Authorization: `Token ${token}` }
            }
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
          const token = localStorage.getItem("token");
          
          // Fetch clusters for the contest
          const clusterResponse = await axios.get(
            `/api/mapping/clusterToContest/getAllClustersByContest/${contestId}/`,
            {
              headers: { Authorization: `Token ${token}` }
            }
          );
          
          const clusterData = (clusterResponse.data?.Clusters ?? []).map((c: any) => ({ 
            id: c.id, 
            cluster_name: c.cluster_name ?? c.name, 
            teams: [] 
          }));

          // Fetch teams for each cluster and calculate rankings
          const clustersWithTeams = await Promise.all(
            clusterData.map(async (cluster: any) => {
              try {
                const teamResponse = await axios.get(
                  `/api/mapping/clusterToTeam/getAllTeamsByCluster/${cluster.id}/`,
                  {
                    headers: { Authorization: `Token ${token}` }
                  }
                );
                
                
                const teams = (teamResponse.data?.Teams ?? []).map((t: any) => ({ 
                  id: t.id, 
                  team_name: t.team_name ?? t.name, 
                  school_name: t.school_name ?? 'N/A', 
                  total_score: t.total_score ?? 0,
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
                      const statusResponse = await axios.get(
                        `/api/mapping/scoreSheet/allSubmittedForTeam/${t.id}/`,
                        {
                          headers: { Authorization: `Token ${token}` }
                        }
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
          const token = localStorage.getItem("token");
          const requestData = {
            contestid: contestId,
            championship_team_ids: championshipTeamIds
          };
          
          const response = await axios.post(
            `/api/tabulation/advanceToChampionship/`,
            requestData,
            {
              headers: { Authorization: `Token ${token}` }
            }
          );
          
          if (response.data.ok) {
            // Refresh the clusters to show the new championship/redesign clusters
            const { fetchClustersWithTeamsForContest } = useRankingsStore.getState();
            await fetchClustersWithTeamsForContest(contestId);
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
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/tabulation/undoChampionshipAdvancement/`,
            {
              contestid: contestId,
            },
            {
              headers: { Authorization: `Token ${token}` }
            }
          );
          
          if (response.data.ok) {
            // Refresh the clusters to show the reverted state
            const { fetchClustersWithTeamsForContest } = useRankingsStore.getState();
            await fetchClustersWithTeamsForContest(contestId);
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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/tabulation/listAdvancers/?contestid=${contestId}`,
            {
              headers: { Authorization: `Token ${token}` }
            }
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