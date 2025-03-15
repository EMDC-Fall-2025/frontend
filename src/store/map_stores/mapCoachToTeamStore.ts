import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Team, Coach } from "../../types";

interface MapCoachTeamState {
  teams: Team[];
  isLoadingMapCoachToTeam: boolean;
  mapCoachToTeamError: string | null;
  coachesByTeams: Record<number, Coach>;
  createCoachTeamMapping: (data: object) => Promise<void>;
  fetchTeamsByCoachId: (coachId: number) => Promise<void>;
  deleteCoachTeamMapping: (mapId: number) => Promise<void>;
  clearTeams: () => void;
  fetchCoachesByTeams: (data: object) => Promise<void>;
  clearCoachesByTeams: () => void;
}

export const useMapCoachToTeamStore = create<MapCoachTeamState>()(
  persist(
    (set) => ({
      teams: [],
      coach: null,
      isLoadingMapCoachToTeam: false,
      mapCoachToTeamError: null,
      coachesByTeams: {},

      clearTeams: () => set({ teams: [] }),
      clearCoachesByTeams: () => set({ coachesByTeams: {} }),

      createCoachTeamMapping: async (data: object) => {
        set({ isLoadingMapCoachToTeam: true });
        try {
          const token = localStorage.getItem("token");
          await axios.post("/api/mapping/coachToTeam/create/", data, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ mapCoachToTeamError: null });
        } catch (mapCoachToTeamError: any) {
          const errorMessage = "Failed to create coach-team mapping";
          set({ mapCoachToTeamError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingMapCoachToTeam: false });
        }
      },

      fetchCoachesByTeams: async (data: object) => {
        set({ isLoadingMapCoachToTeam: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            "/api/mapping/coachToTeam/coachesByTeams/",
            data,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set((state) => ({
            coachesByTeams: {
              ...state.coachesByTeams,
              ...response.data,
            },
          }));
          set({ mapCoachToTeamError: null });
        } catch (mapCoachToTeamError: any) {
          const errorMessage = "Failed to get coaches by teams mapping";
          set({ mapCoachToTeamError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingMapCoachToTeam: false });
        }
      },

      fetchTeamsByCoachId: async (coachId: number) => {
        set({ isLoadingMapCoachToTeam: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/coachToTeam/teamsByCoach/${coachId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set({ teams: response.data.Teams, mapCoachToTeamError: null });
        } catch (mapCoachToTeamError: any) {
          const errorMessage = "Failed to fetch teams by coach ID";
          set({ mapCoachToTeamError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingMapCoachToTeam: false });
        }
      },

      deleteCoachTeamMapping: async (mapId: number) => {
        set({ isLoadingMapCoachToTeam: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/mapping/coachToTeam/delete/${mapId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ mapCoachToTeamError: null });
        } catch (mapCoachToTeamError: any) {
          const errorMessage = "Failed to delete coach-team mapping";
          set({ mapCoachToTeamError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingMapCoachToTeam: false });
        }
      },
    }),
    {
      name: "map-coach-team-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
