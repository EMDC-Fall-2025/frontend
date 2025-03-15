import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { ScoreSheet, ScoreSheetDetails } from "../../types";

interface ScoreSheetState {
  scoreSheet: ScoreSheet | null;
  isLoadingScoreSheet: boolean;
  scoreSheetError: string | null;
  scoreSheetBreakdown: ScoreSheetDetails;
  fetchScoreSheetById: (scoresId: number) => Promise<void>;
  createScoreSheet: (data: Partial<ScoreSheet>) => Promise<void>;
  editScoreSheet: (data: Partial<ScoreSheet>) => Promise<void>;
  updateScores: (data: Partial<ScoreSheet>) => Promise<void>;
  editScoreSheetField: (
    id: number,
    field: string | number,
    newValue: any
  ) => Promise<void>;
  deleteScoreSheet: (scoresId: number) => Promise<void>;
  createSheetsForTeamsInCluster: (
    judgeId: number,
    clusterId: number,
    penalties: boolean,
    presentation: boolean,
    journal: boolean,
    mdo: boolean
  ) => Promise<void>;
  clearScoreSheet: () => void;
  getScoreSheetBreakdown: (teamId: number) => Promise<void>;
  clearScoreBreakdown: () => void;
}

export const useScoreSheetStore = create<ScoreSheetState>()(
  persist(
    (set) => ({
      scoreSheet: null,
      createdScoreSheets: [],
      isLoadingScoreSheet: false,
      scoreSheetError: null,
      scoreSheetBreakdown: null,

      clearScoreSheet: async () => {
        try {
          set({ scoreSheet: null });
          set({ scoreSheetError: null });
        } catch (scoreSheetError) {
          set({
            scoreSheetError: "Error clearing out score sheet in state",
          });
          throw new Error("Error clearing out score sheet in state");
        }
      },

      clearScoreBreakdown: async () => {
        try {
          set({ scoreSheetBreakdown: null });
          set({ scoreSheetError: null });
        } catch (scoreSheetError) {
          set({
            scoreSheetError:
              "Error clearing out score sheet breakdown in state",
          });
          throw new Error("Error clearing out score sheet breakdown in state");
        }
      },

      // Fetch a score sheet by ID
      fetchScoreSheetById: async (scoresId: number) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/scoreSheet/get/${scoresId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ scoreSheet: response.data.ScoreSheet });
          set({ scoreSheetError: null });
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to fetch score sheet" });
          throw new Error("Failed to fetch score sheet");
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },

      getScoreSheetBreakdown: async (teamId: number) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/scoreSheet/getDetails/${teamId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set({ scoreSheetBreakdown: response.data as ScoreSheetDetails });
          set({ scoreSheetError: null });
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to fetch score sheet breakdown" });
          throw new Error("Failed to fetch score sheet breakdown");
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },

      // Create a new score sheet
      createScoreSheet: async (data: Partial<ScoreSheet>) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/scoreSheet/create/`, data, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ scoreSheet: response.data });
          set({ scoreSheetError: null });
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to create score sheet" });
          throw new Error("Failed to create score sheet");
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },

      // Edit a score sheet by providing new data
      editScoreSheet: async (data: Partial<ScoreSheet>) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/scoreSheet/edit/`, data, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ scoreSheet: response.data.edit_score_sheets });
          set({ scoreSheetError: null });
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to edit score sheet" });
          throw new Error("Failed to edit score sheet");
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },

      // Update scores in the score sheet
      updateScores: async (data: Partial<ScoreSheet>) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/scoreSheet/edit/updateScores/`,
            data,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set({ scoreSheet: response.data.updated_sheet });
          set({ scoreSheetError: null });
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to update score sheet" });
          throw new Error("Failed to update score sheet");
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },

      // Edit a specific field in the score sheet
      editScoreSheetField: async (
        id: number,
        field: string | number,
        newValue: any
      ) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/scoreSheet/edit/editField/`,
            { id, field, new_value: newValue },
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set({ scoreSheet: response.data.score_sheet });
          set({ scoreSheetError: null });
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to edit score sheet field" });
          throw new Error("Failed to edit score sheet field");
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },

      // Delete a score sheet by ID
      deleteScoreSheet: async (scoresId: number) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/scoreSheet/delete/${scoresId}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set({ scoreSheet: null });
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to delete score sheet" });
          throw new Error("Failed to delete score sheet");
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },

      // Create score sheets for all teams in a cluster
      createSheetsForTeamsInCluster: async (
        judgeId: number,
        clusterId: number,
        penalties: boolean,
        presentation: boolean,
        journal: boolean,
        mdo: boolean
      ) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/scoreSheet/createForCluster/`,
            { judgeId, clusterId, penalties, presentation, journal, mdo },
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set({ scoreSheetError: null });
        } catch (scoreSheetError: any) {
          set({
            scoreSheetError:
              "Failed to create score sheets for teams in cluster",
          });
          throw new Error("Failed to create score sheets for teams in cluster");
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },
    }),
    {
      name: "score-sheet-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
