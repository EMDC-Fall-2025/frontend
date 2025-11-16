import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Contest, Team } from "../../types";

interface MapContestToTeamState {
  contestsForTeams: { [key: number]: Contest | null };
  teamsByContest: Team[];
  isLoadingMapContestToTeam: boolean;
  mapContestToTeamError: string | null;
  fetchContestsByTeams: (teamIds: Team[]) => Promise<void>;
  fetchTeamsByContest: (contestId: number) => Promise<void>;
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

      fetchContestsByTeams: async (teams: Team[]) => {
        set({ isLoadingMapContestToTeam: true });
        try {
          const response = await api.post(
            "/api/mapping/contestToTeam/contestsByTeams/",
            teams
          );

          set({
            contestsForTeams: response.data,
            mapContestToTeamError: null,
          });
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
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
