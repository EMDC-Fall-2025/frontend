import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import toast from "react-hot-toast";
import { ScoreSheet, ScoreSheetDetails } from "../../types";

interface ScoreSheetState {
  scoreSheet: ScoreSheet | null;
  createdScoreSheets: ScoreSheet[]; // Array to store created score sheets
  isLoadingScoreSheet: boolean;
  scoreSheetError: string | null;
  scoreSheetBreakdown: ScoreSheetDetails;
  multipleScoreSheets: ScoreSheet[] | null;
  
  // Existing methods
  fetchScoreSheetById: (scoresId: number) => Promise<void>;
  createScoreSheet: (data: Partial<ScoreSheet>) => Promise<void>;
  editScoreSheet: (data: Partial<ScoreSheet>) => Promise<void>;
  updateScores: (data: Partial<ScoreSheet>) => Promise<void>;
  submitScoreSheet: (data: Partial<ScoreSheet>) => Promise<void>; // New optimized submission method
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
  setScoreSheet: (scoreSheet: ScoreSheet) => void;
  
  // New methods
  fetchMultipleScoreSheets: (teamIds: number[], judgeId: number, sheetType: number) => Promise<void>;
  updateMultipleScores: (scoreSheets: Partial<ScoreSheet>[]) => Promise<void>;
  submitMultipleScoreSheets: (scoreSheets: Partial<ScoreSheet>[]) => Promise<void>;
}

export const useScoreSheetStore = create<ScoreSheetState>()(
  persist(
    (set, get) => ({
      scoreSheet: null,
      createdScoreSheets: [],
      isLoadingScoreSheet: false,
      scoreSheetError: null,
      scoreSheetBreakdown: null,
      multipleScoreSheets: null,

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

      // Direct method to set scoresheet data (for optimized loading)
      setScoreSheet: (scoreSheet: ScoreSheet) => {
        set({ scoreSheet, scoreSheetError: null });
      },

      // Optimized submission method - no loading state for instant response
      submitScoreSheet: async (data: Partial<ScoreSheet>) => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(`/api/scoreSheet/edit/`, data, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          set({ scoreSheet: response.data.edit_score_sheets });
          set({ scoreSheetError: null });
          
          // Show success toast based on sheet type
          const sheetTypeNames = {
            1: "Presentation",
            2: "Journal", 
            3: "Machine Design",
            4: "Run Penalties",
            5: "Other Penalties",
            6: "Redesign",
            7: "Championship"
          };
          
          const sheetTypeName = sheetTypeNames[data.sheetType as keyof typeof sheetTypeNames] || "Score Sheet";
          toast.success(`${sheetTypeName} scoresheet submitted successfully!`);
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to submit score sheet" });
          toast.error("Failed to submit scoresheet. Please try again.");
          throw new Error("Failed to submit score sheet");
        }
      },

      // Fetch a score sheet by ID
      fetchScoreSheetById: async (scoresId: number) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/scoreSheet/get/${scoresId}/`, {
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
            `/api/scoreSheet/getDetails/${teamId}/`,
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
          const response = await axios.post(`/api/scoreSheet/create/`, data, {
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
          const response = await axios.post(`/api/scoreSheet/edit/`, data, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ scoreSheet: response.data.edit_score_sheets });
          set({ scoreSheetError: null });
          
          // Show success toast based on sheet type
          const sheetTypeNames = {
            1: "Presentation",
            2: "Journal", 
            3: "Machine Design",
            4: "Run Penalties",
            5: "Other Penalties",
            6: "Redesign",
            7: "Championship"
          };
          
          const sheetTypeName = sheetTypeNames[data.sheetType as keyof typeof sheetTypeNames] || "Score Sheet";
          
          if (data.isSubmitted) {
            toast.success(`${sheetTypeName} scoresheet submitted successfully!`);
          } else {
            toast.success(`${sheetTypeName} scoresheet saved successfully!`);
          }
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to edit score sheet" });
          toast.error("Failed to save scoresheet. Please try again.");
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
            `/api/scoreSheet/edit/updateScores/`,
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
          
          // Show success toast for draft save
          toast.success("Scoresheet saved as draft!");
        } catch (scoreSheetError: any) {
          set({ scoreSheetError: "Failed to update score sheet" });
          toast.error("Failed to save scoresheet. Please try again.");
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
            `/api/scoreSheet/edit/editField/`,
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
          await axios.delete(`/api/scoreSheet/delete/${scoresId}/`, {
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
            `/api/scoreSheet/createForCluster/`,
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

      // New methods for multiple score sheets
      // Fetch score sheets for multiple teams
      fetchMultipleScoreSheets: async (teamIds: number[], judgeId: number, sheetType: number) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          
          // First get the score sheet IDs for each team
          const sheetsPromises = teamIds.map(async (teamId) => {
            try {
              // Fetch score sheet data
              const mapResponse = await axios.get(`/api/mapping/scoreSheet/getByTeamJudge/${sheetType}/${judgeId}/${teamId}/`, {
                headers: {
                  Authorization: `Token ${token}`,
                  "Content-Type": "application/json",
                }
              });
          
              const scoreSheetId = mapResponse.data.ScoreSheet?.id;

          
              if (scoreSheetId) {
                const sheetResponse = await axios.get(`/api/scoreSheet/get/${scoreSheetId}/`, {
                  headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                  }
                });
          
                return {
                  ...sheetResponse.data.ScoreSheet,
                  teamId,
                  judgeId,
                  sheetType,
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching score sheet for team ${teamId}:`, error);
              return null;
            }
          });
          
          const results = await Promise.all(sheetsPromises);
          
          const validSheets = results.filter((sheet): sheet is ScoreSheet => sheet !== null);
          set({ 
            multipleScoreSheets: validSheets,
            scoreSheetError: null 
          });
        } catch (error) {
          set({ scoreSheetError: "Failed to fetch multiple score sheets" });
          console.error("Failed to fetch multiple score sheets:", error);
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },
      
      // Update scores for multiple score sheets
      updateMultipleScores: async (scoreSheets: Partial<ScoreSheet>[]) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          
          const updatePromises = scoreSheets.map(sheet => 
            axios.post(`/api/scoreSheet/edit/updateScores/`, sheet, {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              }
            })
          );
          
          await Promise.all(updatePromises);
          
          // After successful updates, refresh the data
          const currentSheets = get().multipleScoreSheets;
          if (currentSheets && currentSheets.length > 0) {
            const teamIds = currentSheets.map(sheet => sheet.teamId).filter((id): id is number => id !== undefined);
            const sampleSheet = currentSheets[0];
            
            if (teamIds.length > 0 && sampleSheet?.judgeId && sampleSheet?.sheetType) {
              await get().fetchMultipleScoreSheets(teamIds, sampleSheet.judgeId, sampleSheet.sheetType);
            }
          }
          
          set({ scoreSheetError: null });
        } catch (error) {
          set({ scoreSheetError: "Failed to update multiple score sheets" });
          console.error("Failed to update multiple score sheets:", error);
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      },
      
      // Submit multiple score sheets (mark as submitted)
      submitMultipleScoreSheets: async (scoreSheets: Partial<ScoreSheet>[]) => {
        set({ isLoadingScoreSheet: true });
        try {
          const token = localStorage.getItem("token");
          
          const submitPromises = scoreSheets.map(sheet => 
            axios.post(`/api/scoreSheet/edit/`, {
              ...sheet,
              isSubmitted: true
            }, {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              }
            })
          );
          
          await Promise.all(submitPromises);
          set({ scoreSheetError: null });
          
          // Show success toast for multiple submissions
          toast.success(`${scoreSheets.length} scoresheets submitted successfully!`);
        } catch (error) {
          set({ scoreSheetError: "Failed to submit multiple score sheets" });
          toast.error("Failed to submit scoresheets. Please try again.");
          console.error("Failed to submit multiple score sheets:", error);
        } finally {
          set({ isLoadingScoreSheet: false });
        }
      }
    }),

    
    {
      name: "score-sheet-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )


);