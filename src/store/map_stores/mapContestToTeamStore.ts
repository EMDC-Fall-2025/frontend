import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Contest, Team } from "../../types";

interface MapContestToTeamState {
  contestsForTeams: { [key: number]: Contest | null };
  teamsByContest: Team[];
  teamsByContestMap?: { [contestId: number]: Team[] };
  isLoadingMapContestToTeam: boolean;
  mapContestToTeamError: string | null;
  fetchContestsByTeams: (teamIds: Team[]) => Promise<void>;
  fetchTeamsByContest: (contestId: number, forceRefresh?: boolean) => Promise<void>;
  updateContestInTeams: (updatedContest: Contest) => void;
  clearContests: () => void;
  clearTeamsByContest: () => void;
}

export const useMapContestToTeamStore = create<MapContestToTeamState>()(
  persist(
    (set, get) => ({
      contestsForTeams: {},
      isLoadingMapContestToTeam: false,
      mapContestToTeamError: null,
      teamsByContest: [],
      teamsByContestMap: {},

      clearContests: () => set({ contestsForTeams: {} }),
      clearTeamsByContest: () => set({ teamsByContest: [] }),

      updateContestInTeams: (updatedContest: Contest) => {
        set((state) => {
          const updatedContestsForTeams = { ...state.contestsForTeams };
          // Update contest data for all teams that have this contest
          Object.keys(updatedContestsForTeams).forEach((teamIdStr) => {
            const teamId = parseInt(teamIdStr, 10);
            const contest = updatedContestsForTeams[teamId];
            if (contest && contest.id === updatedContest.id) {
              updatedContestsForTeams[teamId] = updatedContest;
            }
          });
          return { contestsForTeams: updatedContestsForTeams };
        });
      },

      fetchContestsByTeams: async (teams: Team[]) => {
        // Check cache first - if we already have contest data for all teams, return early
        const state = get();
        const teamsNeedingData = teams.filter(team => !state.contestsForTeams[team.id]);
        
        if (teamsNeedingData.length === 0) {
          return; // All teams already have cached contest data
        }
        
        set({ isLoadingMapContestToTeam: true });
        try {
          const response = await api.post(
            "/api/mapping/contestToTeam/contestsByTeams/",
            teamsNeedingData
          );

          set((currentState) => ({
            contestsForTeams: { ...currentState.contestsForTeams, ...response.data },
            mapContestToTeamError: null,
          }));
        } catch (error: any) {
          const errorMessage = "Failed to fetch contests by team IDs";
          set({ mapContestToTeamError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestToTeam: false });
        }
      },

      fetchTeamsByContest: async (contestId: number, forceRefresh: boolean = false) => {
        // Instant render from cache if available and not forcing refresh
        const byContestMap = get().teamsByContestMap || {};
        if (!forceRefresh && byContestMap[contestId] && byContestMap[contestId]!.length > 0) {
          set({ teamsByContest: byContestMap[contestId]!, mapContestToTeamError: null });
          return;
        }

        set({ isLoadingMapContestToTeam: true });
        try {
          const response = await api.get(
            `/api/mapping/teamToContest/getTeamsByContest/${contestId}/`
          );

          set((state) => ({
            teamsByContest: response.data,
            teamsByContestMap: { ...(state.teamsByContestMap || {}), [contestId]: response.data },
            mapContestToTeamError: null,
          }));
        } catch (error: any) {
          const errorMessage = "Failed to fetch teams by contest id";
          set({ mapContestToTeamError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestToTeam: false });
        }
      },
    }),
    {
      name: "map-contest-to-team-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);


