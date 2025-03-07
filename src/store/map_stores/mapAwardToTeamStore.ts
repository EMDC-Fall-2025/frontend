import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
// FILE OVERVIEW: This file contains a zustand store for managing special awards
//                Handles API calls and manages loading/error states and persists data in session storage

// Define structure of SpecialAward 
interface SpecialAward {
  teamid: number;
  award_name: string;
  isjudge: boolean;
}

// Define structure of the state managed by store
interface SpecialAwardState {
  awards: SpecialAward[];
  isLoading: boolean;
  error: string | null;

  // Methods to interact with the state/backend
  getAllAwards: () => Promise<void>;
  getAwardsByTeam: (teamId: number) => Promise<void>;
  AwardsByTeamTable: (teamId: number) => Promise<void>;
  createAward: (award: SpecialAward) => Promise<void>;
  updateAward: (teamId: number, awardName: string, updatedAward: SpecialAward) => Promise<void>;
  deleteAward: (teamId: number, awardName: string) => Promise<void>;
  clearAwards: () => void;
}

// create Zustand store
const useSpecialAwardStore = create<SpecialAwardState>()(
  persist(
    (set) => ({
      awards: [],
      isLoading: false,
      error: null,

      // Method to get all awards
      getAllAwards: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/mapping/awardToTeam/getAllAwards/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          set({ awards: response.data.awards, isLoading: false });
        } catch (error: any) {
          set({ error: "Error fetching awards", isLoading: false });
        }
      },

      // Method to get awards for specific team
      getAwardsByTeam: async (teamId: number) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/mapping/awardToTeam/getAwardByTeam/${teamId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ awards: response.data, isLoading: false });
        } catch (error: any) {
          set({ error: "Error fetching awards", isLoading: false });
        }
      },

      // Method to get and organize award data for a specific team
      AwardsByTeamTable: async (teamId: number) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/mapping/awardToTeam/getAwardByTeam/${teamId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });

          set((state) => ({
            awards: { ...state.awards, [teamId]: response.data },
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: "Error fetching awards", isLoading: false });
        }
      },
      
      // Method to create a new award
      createAward: async (award: SpecialAward) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          await axios.post(`/api/mapping/awardToTeam/create/`, award, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set((state) => ({ awards: [...state.awards, award], isLoading: false }));
        } catch (error: any) {
          set({ error: "Error creating award", isLoading: false });
        }
      },

      // Method to update an existing award
      updateAward: async (teamId: number, awardName: string, updatedAward: SpecialAward) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          await axios.put(`/api/mapping/awardToTeam/update/${teamId}/${awardName}/`, updatedAward, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set((state) => ({
            awards: state.awards.map((award) =>
              award.teamid === teamId && award.award_name === awardName ? updatedAward : award
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: "Error updating award", isLoading: false });
        }
      },

      // Method to delete an award
      deleteAward: async (teamId: number, awardName: string) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/mapping/awardToTeam/delete/${teamId}/${awardName}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set((state) => ({
            awards: state.awards.filter(
              (award) => !(award.teamid === teamId && award.award_name === awardName)
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: "Error deleting award", isLoading: false });
        }
      },

      clearAwards: () => set({ awards: [], error: null }),
    }),
    {
      name: "special-award-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useSpecialAwardStore;
