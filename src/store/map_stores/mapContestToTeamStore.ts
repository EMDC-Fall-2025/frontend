import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
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
    (set) => ({
      contestsForTeams: {},
      isLoadingMapContestToTeam: false,
      mapContestToTeamError: null,
      teamsByContest: [],

      clearContests: () => set({ contestsForTeams: {} }),
      clearTeamsByContest: () => set({ teamsByContest: [] }),

      fetchContestsByTeams: async (teams: Team[]) => {
        set({ isLoadingMapContestToTeam: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            "/api/mapping/contestToTeam/contestsByTeams/",
            teams,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
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
        set({ isLoadingMapContestToTeam: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/teamToContest/getTeamsByContest/${contestId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
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
