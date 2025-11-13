import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { EditedJudge, Judge, NewJudge } from "../../types";
import { extractErrorMessage } from "../../utils/errorHandler";

interface JudgeState {
  judge: Judge | null;
  isLoadingJudge: boolean;
  judgeError: string | null;
  submissionStatus: { [clusterId: number]: { [judgeId: number]: boolean } } | null;
  fetchJudgeById: (judgeId: number) => Promise<void>;
  createJudge: (newJudge: NewJudge) => Promise<Judge>;
  editJudge: (editedJudge: EditedJudge) => Promise<Judge>;
  deleteJudge: (judgeId: number) => Promise<void>;
  checkAllScoreSheetsSubmitted: (judges: Judge[], clusterId?: number) => Promise<void>;
  judgeDisqualifyTeam: (
    teamId: number,
    isDisqualified: boolean
  ) => Promise<void>;
  clearSubmissionStatus: () => void;
  clearJudge: () => void;
}

export const useJudgeStore = create<JudgeState>()(
  persist(
    (set) => ({
      judge: null,
      isLoadingJudge: false,
      judgeError: null,
      submissionStatus: null,

      clearJudge: async () => {
        try {
          set({ judge: null });
          set({ judgeError: null });
        } catch (judgeError) {
          set({ judgeError: "Error clearing out judge in state" });
          throw Error("Error clearing out judge in state");
        }
      },

      clearSubmissionStatus: async () => {
        try {
          set({ submissionStatus: null });
          set({ judgeError: null });
        } catch (judgeError) {
          set({ judgeError: "Error clearing out submission status in state" });
          throw Error("Error clearing out submission status in state");
        }
      },

      fetchJudgeById: async (judgeId: number) => {
        set({ isLoadingJudge: true });
        try {
          const { data } = await api.get(`/api/judge/get/${judgeId}/`);
          set({ judge: data.Judge });
          set({ judgeError: null });
        } catch (judgeError: any) {
          const errorMessage = "Error fetching judge:" + judgeError;
          set({ judgeError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingJudge: false });
        }
      },

      createJudge: async (newJudge: NewJudge) => {
        set({ isLoadingJudge: true });
        try {
          const { data } = await api.post(`/api/judge/create/`, newJudge);
          const createdJudge = (data as any)?.judge;
          set({ judge: createdJudge, judgeError: null });
          return createdJudge;
        } catch (judgeError: any) {
          // Convert error to string to prevent React rendering issues
          const errorMessage = extractErrorMessage(judgeError) || "Error creating judge";
          set({ judgeError: errorMessage });
          throw judgeError; 
        } finally {
          set({ isLoadingJudge: false });
        }
      },

      editJudge: async (editedJudge: EditedJudge) => {
        set({ isLoadingJudge: true });
        try {
          const { data } = await api.post(`/api/judge/edit/`, editedJudge);
          const updatedJudge = data.judge;
          set(() => ({
            judge: updatedJudge,
          }));
          set({ judgeError: null });
          return updatedJudge;
        } catch (judgeError: any) {
          // Convert error to string to prevent React rendering issues
          const errorMessage = extractErrorMessage(judgeError) || "Error editing judge";
          set({ judgeError: errorMessage });
          throw judgeError; // Re-throw the original error
        } finally {
          set({ isLoadingJudge: false });
        }
      },

      deleteJudge: async (judgeId: number) => {
        set({ isLoadingJudge: true });
        try {
          await api.delete(`/api/judge/delete/${judgeId}/`);
          set({ judgeError: null });
        } catch (judgeError) {
          const errorMessage = "Error deleting judge:" + judgeError;
          set({ judgeError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingJudge: false });
        }
      },

      checkAllScoreSheetsSubmitted: async (judges: Judge[], clusterId?: number) => {
        set({ isLoadingJudge: true });
        try {
          const url = clusterId ? `/api/judge/allScoreSheetsSubmitted/?cluster_id=${clusterId}` : `/api/judge/allScoreSheetsSubmitted/`;
          const { data } = await api.post(url, judges);
          
          // Store submission status per cluster to avoid overwriting other clusters
          if (clusterId) {
            set((state) => ({
              submissionStatus: {
                ...(state.submissionStatus || {}),
                [clusterId]: data,
              },
            }));
          } else {
            // If no clusterId, store as before (for backward compatibility)
            set({ submissionStatus: { 0: data } });
          }
          set({ judgeError: null });
        } catch (judgeError: any) {
          const errorMessage =
            "Error checking score sheets submission:" + judgeError;
          set({ judgeError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingJudge: false });
        }
      },

      judgeDisqualifyTeam: async (teamId: number, isDisqualified: boolean) => {
        set({ isLoadingJudge: true });
        try {
          await api.post(`/api/judge/disqualifyTeam/`, {
            teamid: teamId,
            judge_disqualified: isDisqualified,
          });
          set({ judgeError: null });
        } catch (judgeError: any) {
          const errorMessage = "Error disqualifying team:" + judgeError;
          set({ judgeError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingJudge: false });
        }
      },
    }),
    {
      name: "judge-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
