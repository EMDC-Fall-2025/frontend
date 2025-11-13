import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Contest, Team } from "../../types";
import { registerStoreSync } from "../utils/storageSync";

interface MapContestToTeamState {
  contestsForTeams: { [key: number]: Contest | null };
  teamsByContest: Team[];
  isLoadingMapContestToTeam: boolean;
  mapContestToTeamError: string | null;
  fetchContestsByTeams: (teamIds: Team[]) => Promise<void>;
  fetchTeamsByContest: (contestId: number) => Promise<void>;
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

      fetchTeamsByContest: async (contestId: number) => {
        // Check cache first - if we already have teams for this contest, return early
        // teamsByContest is a single array, so we check if it's already populated
        const cachedTeams = get().teamsByContest;
        if (cachedTeams && cachedTeams.length > 0) {
          // Check if any team belongs to this contest
          const hasTeamsForContest = cachedTeams.some(team => (team as any).contest_id === contestId);
          if (hasTeamsForContest) {
            return; // Use cached data
          }
        }
        
        set({ isLoadingMapContestToTeam: true });
        try {
          const response = await api.get(
            `/api/mapping/teamToContest/getTeamsByContest/${contestId}/`
          );

          set({
            teamsByContest: response.data,
            mapContestToTeamError: null,
          });
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
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Register for global storage sync
registerStoreSync('map-contest-to-team-storage', (state) => {
  useMapContestToTeamStore.setState({
    contestsForTeams: state.contestsForTeams || {},
    teamsByContest: state.teamsByContest || [],
  });
});
