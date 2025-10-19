import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import {
  Contest,
  ScoreSheet,
  ScoreSheetMapping,
  ScoreSheetMappingWithSheet,
} from "../../types";

interface MapScoreSheetState {
  scoreSheetId: number | null;
  allSubmittedForContests: Record<number, boolean | null>;
  isLoadingMapScoreSheet: boolean;
  mapScoreSheetError: string | null;
  mappings: Record<
    string,
    { scoresheet: ScoreSheet | null; total: number | null }
  >;
  fetchScoreSheetId: (
    judgeId: number,
    teamId: number,
    sheetType: number
  ) => Promise<void>;
  createScoreSheetMapping: (
    mapping: Partial<ScoreSheetMapping>
  ) => Promise<number | null>;
  deleteScoreSheetMapping: (mapId: number) => Promise<void>;
  fetchScoreSheetsByJudge: (judgeId: number) => Promise<void>;
  fetchScoreSheetsByJudgeAndCluster: (judgeId: number, clusterId: number) => Promise<void>;
  allSheetsSubmittedForContests: (contests: Contest[]) => Promise<void>;
  clearMappings: () => void;
  submitAllPenalties: (judgeId: number) => Promise<void>;
  clearAllSubmittedForContests: () => void;
  clearMapScoreSheetError: () => void;
}

export const useMapScoreSheetStore = create<MapScoreSheetState>()(
  persist(
    (set) => ({
      scoreSheetId: null,
      isLoadingMapScoreSheet: false,
      mapScoreSheetError: null,
      mappings: {},
      allSubmittedForContests: {},

      clearMapScoreSheetError: async () => {
        set({ mapScoreSheetError: null });
      },

      clearScoreSheetId: async () => {
        try {
          set({ scoreSheetId: null });
          set({ mapScoreSheetError: null });
        } catch (error) {
          const errorMessage = "Error clearing out score sheet id in state";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      clearAllSubmittedForContests: async () => {
        try {
          set({ allSubmittedForContests: {} });
          set({ mapScoreSheetError: null });
        } catch (error) {
          const errorMessage = "Error clearing out all submitted in state";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      clearMappings: async () => {
        try {
          set({ mappings: {} });
          set({ mapScoreSheetError: null });
        } catch (error) {
          const errorMessage = "Error clearing out mappings in state";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      fetchScoreSheetsByJudge: async (judgeId: number) => {
        set({ isLoadingMapScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/scoreSheet/getSheetsByJudge/${judgeId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const fetchedMappings: Record<
            string,
            { scoresheet: ScoreSheet | null; total: number | null }
          > = {};
          response.data.ScoreSheets.forEach(
            (item: ScoreSheetMappingWithSheet) => {
              const key = `${item.mapping.teamid}-${item.mapping.judgeid}-${item.mapping.sheetType}`;
              fetchedMappings[key] = {
                scoresheet: item.scoresheet,
                total: item.total,
              };
            }
          );
          set({ mappings: fetchedMappings });
          set({ mapScoreSheetError: null });
        } catch (error: any) {
          console.error('Error fetching score sheets by judge:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
          const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to fetch score sheets by judge";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapScoreSheet: false });
        }
      },

      fetchScoreSheetsByJudgeAndCluster: async (judgeId: number, clusterId: number) => {
        set({ isLoadingMapScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/scoreSheet/getSheetsByJudgeAndCluster/${judgeId}/${clusterId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const fetchedMappings: Record<
            string,
            { scoresheet: ScoreSheet | null; total: number | null }
          > = {};
          response.data.ScoreSheets.forEach(
            (item: ScoreSheetMappingWithSheet) => {
              const key = `${item.mapping.teamid}-${item.mapping.judgeid}-${item.mapping.sheetType}`;
              fetchedMappings[key] = {
                scoresheet: item.scoresheet,
                total: item.total,
              };
            }
          );
          set({ mappings: fetchedMappings });
          set({ mapScoreSheetError: null });
        } catch (error) {
          const errorMessage = "Failed to fetch score sheets by judge and cluster";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapScoreSheet: false });
        }
      },

      fetchScoreSheetId: async (
        judgeId: number,
        teamId: number,
        sheetType: number
      ) => {
        set({ isLoadingMapScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/scoreSheet/getByTeamJudge/${sheetType}/${judgeId}/${teamId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          const fetchedScoreSheetId = response.data.ScoreSheet.id;
          set({ scoreSheetId: fetchedScoreSheetId });
          set({ mapScoreSheetError: null });
        } catch (error) {
          const errorMessage = "Failed to fetch score sheet ID";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapScoreSheet: false });
        }
      },

      allSheetsSubmittedForContests: async (contests: Contest[]) => {
        set({ isLoadingMapScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/mapping/scoreSheet/allSheetsSubmittedForContests/`,
            contests,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const submissionStatus = response.data;
          set({ mapScoreSheetError: null });
          set({ allSubmittedForContests: submissionStatus });
        } catch (error) {
          const errorMessage = "Failed to submit contests";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapScoreSheet: false });
        }
      },

      // Create new score sheet mapping and return the scoresheet id
      createScoreSheetMapping: async (mapping: Partial<ScoreSheetMapping>) => {
        set({ isLoadingMapScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/scoreSheet/mapping/create/`,
            mapping,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          const newScoreSheetId = response.data.scoresheetid;
          set({ scoreSheetId: newScoreSheetId });
          set({ mapScoreSheetError: null });
          return newScoreSheetId;
        } catch (error) {
          const errorMessage = "Failed to create score sheet mapping";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapScoreSheet: false });
        }
      },

      // Delete score sheet mapping by ID
      deleteScoreSheetMapping: async (mapId: number) => {
        set({ isLoadingMapScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/scoreSheet/mapping/delete/${mapId}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set({ scoreSheetId: null });
          set({ mapScoreSheetError: null });
        } catch (error) {
          const errorMessage = "Failed to delete score sheet mapping";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapScoreSheet: false });
        }
      },

      submitAllPenalties: async (judgeId: number) => {
        set({ isLoadingMapScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/mapping/scoreSheet/submitAllPenalties/`,
            { judge_id: judgeId },
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
        } catch (error) {
          const errorMessage = "Failed to submit all penalties";
          set({ mapScoreSheetError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapScoreSheet: false });
        }
      },
    }),
    {
      name: "map-score-sheet-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useMapScoreSheetStore;
