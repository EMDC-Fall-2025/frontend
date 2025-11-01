import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { EditedJudge, Judge, NewJudge } from "../../types";

interface JudgeState {
  judge: Judge | null;
  isLoadingJudge: boolean;
  judgeError: string | null;
  submissionStatus: { [key: number]: boolean } | null;
  fetchJudgeById: (judgeId: number) => Promise<void>;
  createJudge: (newJudge: NewJudge) => Promise<Judge>;
  editJudge: (editedJudge: EditedJudge) => Promise<Judge>;
  deleteJudge: (judgeId: number) => Promise<void>;
  checkAllScoreSheetsSubmitted: (judges: Judge[]) => Promise<void>;
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
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/judge/get/${judgeId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ judge: response.data.Judge });
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
          const token = localStorage.getItem("token");
          const response = await axios.post(`/api/judge/create/`, newJudge, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          const createdJudge = (response.data as any)?.judge;
          set({ judge: createdJudge, judgeError: null });
          return createdJudge;
        } catch (judgeError: any) {
          // Convert error to string to prevent React rendering issues
          let errorMessage = "Error creating judge";
          if (judgeError?.response?.data) {
            const data = judgeError.response.data;
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
          set({ judgeError: errorMessage });
          throw judgeError; // Re-throw the original error
        } finally {
          set({ isLoadingJudge: false });
        }
      },

      editJudge: async (editedJudge: EditedJudge) => {
        set({ isLoadingJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(`/api/judge/edit/`, editedJudge, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          const updatedJudge = response.data.judge;
          set(() => ({
            judge: updatedJudge,
          }));
          set({ judgeError: null });
          return updatedJudge;
        } catch (judgeError: any) {
          // Convert error to string to prevent React rendering issues
          let errorMessage = "Error editing judge";
          if (judgeError?.response?.data) {
            const data = judgeError.response.data;
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
          set({ judgeError: errorMessage });
          throw judgeError; // Re-throw the original error
        } finally {
          set({ isLoadingJudge: false });
        }
      },

      deleteJudge: async (judgeId: number) => {
        set({ isLoadingJudge: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/judge/delete/${judgeId}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set({ judgeError: null });
        } catch (judgeError) {
          const errorMessage = "Error deleting judge:" + judgeError;
          set({ judgeError: errorMessage });
          throw Error(errorMessage);
        } finally {
          set({ isLoadingJudge: false });
        }
      },

      checkAllScoreSheetsSubmitted: async (judges: Judge[]) => {
        set({ isLoadingJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/judge/allScoreSheetsSubmitted/`,
            judges,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set({ submissionStatus: response.data });
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
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/judge/disqualifyTeam/`,
            { teamid: teamId, judge_disqualified: isDisqualified },
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
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