import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Team, NewTeam, EditedTeam } from "../../types";
import { dispatchDataChange } from "../../utils/dataChangeEvents";
import { useMapCoachToTeamStore } from "../map_stores/mapCoachToTeamStore";
import useMapClusterTeamStore from "../map_stores/mapClusterToTeamStore";

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
    (set, get) => ({
      team: null,
      teams: [], 
      isLoadingTeam: false,
      teamError: null,

      clearTeam: () => {
        set({ team: null, teamError: null });
      },

      fetchTeamById: async (teamId: number) => {
        set({ isLoadingTeam: true });
        try {
          const { data } = await api.get(`/api/team/get/${teamId}/`);
          set({ team: data.Team });
          set({ teamError: null });
        } catch (teamError: any) {
          set({ teamError: "Failure fetching team" });
          throw new Error("Failure fetching team");
        } finally {
          set({ isLoadingTeam: false });
        }
      },

      fetchAllTeams: async (forceRefresh: boolean = false) => {
        // Check cache first - if we already have teams and not forcing refresh, return early
        const cachedTeams = get().teams;
        if (!forceRefresh && cachedTeams && cachedTeams.length > 0) {
          return; // Use cached data
        }
        
        set({ isLoadingTeam: true });
        try {
          const { data } = await api.get("/api/team/getAllTeams/");
          set({ teams: data.teams, teamError: null });
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
          const { data } = await api.post(`/api/team/create/`, newTeam);
          const createdTeam = (data as any)?.team;
          const createdCoach = (data as any)?.coach;
          
          // Update coach data in mapCoachToTeamStore if coach data is present
          if (createdTeam && createdCoach) {
            const { updateCoachForAllTeams } = useMapCoachToTeamStore.getState();
            // Update coach for all teams that use the same coach (by username)
            // This includes the current team, so no need to call updateCoachByTeamId separately
            if (createdCoach.username) {
              updateCoachForAllTeams(createdCoach.username, createdCoach);
            }
          }
          
          set({ teamError: null });
          // Dispatch event to notify other components
          if (createdTeam?.id) {
            dispatchDataChange({ type: 'team', action: 'create', id: createdTeam.id, contestId: newTeam.contestid });
          }
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
          const { data } = await api.post(`/api/team/edit/`, editedTeam);
          const updatedTeam = (data as any)?.Team;
          const updatedCoach = (data as any)?.Coach;
          
          // Update coach data in mapCoachToTeamStore if coach data is present
          if (updatedTeam && updatedCoach) {
            const { updateCoachForAllTeams } = useMapCoachToTeamStore.getState();
            // Update coach for all teams that use the same coach (by username)
            // This includes the current team, so no need to call updateCoachByTeamId separately
            if (updatedCoach.username) {
              updateCoachForAllTeams(updatedCoach.username, updatedCoach);
          }
          }
          
          // Update team in team store
          set((state) => ({
            teams: state.teams.map((t) => t.id === updatedTeam.id ? updatedTeam : t),
            // Also update the team object if it matches
            team: state.team && state.team.id === updatedTeam.id ? updatedTeam : state.team,
            teamError: null,
          }));

          // Update team in all clusters where it appears
          if (updatedTeam) {
            const { updateTeamInAllClusters } = useMapClusterTeamStore.getState();
            updateTeamInAllClusters(updatedTeam.id, updatedTeam);
          }
          // Dispatch event to notify other components
          if (updatedTeam?.id) {
            dispatchDataChange({ type: 'team', action: 'update', id: updatedTeam.id, contestId: editedTeam.contestid });
          }
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
          await api.delete(`/api/team/delete/${teamId}/`);
          set({ team: null });
          set({ teamError: null });
          // Dispatch event to notify other components
          dispatchDataChange({ type: 'team', action: 'delete', id: teamId });
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