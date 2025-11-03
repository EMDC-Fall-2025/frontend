import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Team, NewTeam, EditedTeam } from "../../types";

interface TeamState {
  team: Team | null;
  teams: Team[]; 
  isLoadingTeam: boolean;
  teamError: string | null;
  fetchTeamById: (teamId: number) => Promise<void>;
  fetchAllTeams: () => Promise<void>; 
  createTeam: (newTeam: NewTeam) => Promise<Team>;
  editTeam: (editedTeam: EditedTeam) => Promise<Team>;
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
          const response = await axios.get(`/api/team/get/${teamId}/`, {
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
          const response = await axios.post(`/api/team/create/`, newTeam, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          const createdTeam = (response.data as any)?.team;
          set({ teamError: null });
          return createdTeam;
        } catch (teamError: any) {
          
          let errorMessage = "Error creating team";
          if (teamError?.response?.data) {
            const data = teamError.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.error && typeof data.error === 'string') {
              errorMessage = data.error;
            } else if (data.detail && typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (data.message && typeof data.message === 'string') {
              errorMessage = data.message;
            } else {
              errorMessage = JSON.stringify(data);
            }
          }
          set({ teamError: errorMessage });
          throw teamError; 
        } finally {
          set({ isLoadingTeam: false });
        }
      },

      editTeam: async (editedTeam: EditedTeam) => {
        set({ isLoadingTeam: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(`/api/team/edit/`, editedTeam, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          const updatedTeam = (response.data as any)?.Team;
          set({ teamError: null });
          return updatedTeam;
        } catch (teamError: any) {
         
          let errorMessage = "Error editing team";
          if (teamError?.response?.data) {
            const data = teamError.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.error && typeof data.error === 'string') {
              errorMessage = data.error;
            } else if (data.detail && typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (data.message && typeof data.message === 'string') {
              errorMessage = data.message;
            } else {
              errorMessage = JSON.stringify(data);
            }
          }
          set({ teamError: errorMessage });
          throw teamError; 
        } finally {
          set({ isLoadingTeam: false });
        }
      },

      deleteTeam: async (teamId: number) => {
        set({ isLoadingTeam: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/team/delete/${teamId}/`, {
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