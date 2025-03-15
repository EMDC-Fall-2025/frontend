import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Team, NewTeam, EditedTeam } from "../../types";

interface TeamState {
  team: Team | null;
  teams: Team[]; // Add teams array to store all teams
  isLoadingTeam: boolean;
  teamError: string | null;
  fetchTeamById: (teamId: number) => Promise<void>;
  fetchAllTeams: () => Promise<void>; // Add fetchAllTeams function
  createTeam: (newTeam: NewTeam) => Promise<void>;
  editTeam: (editedTeam: EditedTeam) => Promise<void>;
  deleteTeam: (teamId: number) => Promise<void>;
  clearTeam: () => void;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      team: null,
      teams: [], 
      isLoadingTeam: false,
      teamError: null,

      clearTeam: async () => {
        try {
          set({ team: null });
          set({ teamError: null });
        } catch (userRoleError) {
          set({
            teamError: "Error clearing out team in state",
          });
          throw new Error("Error clearing out team in state");
        }
      },

      fetchTeamById: async (teamId: number) => {
        set({ isLoadingTeam: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/team/get/${teamId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ team: response.data.Team });
          set({ teamError: null });
        } catch (teamError: any) {
          set({ teamError: "Failure fetching team" });
          throw new Error("Failure fetching team");
        } finally {
          set({ isLoadingTeam: false });
        }
      },

      fetchAllTeams: async () => {
        set({ isLoadingTeam: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get("/api/team/getAllTeams/", {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set({ teams: response.data.teams });
          set({ teamError: null });
        } catch (teamError: any) {
          set({ teamError: "Failure fetching all teams" });
          throw new Error("Failure fetching all teams");
        } finally {
          set({ isLoadingTeam: false });
        }
      },

      createTeam: async (newTeam: NewTeam) => {
        set({ isLoadingTeam: true });
        try {
          const token = localStorage.getItem("token");
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/team/create/`, newTeam, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ teamError: null });
        } catch (teamError) {
          set({ teamError: "Error creating team" });
          throw new Error("Error creating team");
        } finally {
          set({ isLoadingTeam: false });
        }
      },

      editTeam: async (editedTeam: EditedTeam) => {
        set({ isLoadingTeam: true });
        try {
          const token = localStorage.getItem("token");
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/team/edit/`, editedTeam, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ teamError: null });
        } catch (teamError) {
          set({ teamError: "Error editing team" });
          throw new Error("Error editing team");
        } finally {
          set({ isLoadingTeam: false });
        }
      },

      deleteTeam: async (teamId: number) => {
        set({ isLoadingTeam: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/team/delete/${teamId}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set({ team: null });
          set({ teamError: null });
        } catch (teamError) {
          set({ teamError: "Error deleting team" });
          throw new Error("Error deleting team");
        } finally {
          set({ isLoadingTeam: false });
        }
      },
    }),
    {
      name: "team-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
