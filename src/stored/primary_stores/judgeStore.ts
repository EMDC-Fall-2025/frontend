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
  createJudge: (newJudge: NewJudge) => Promise<void>;
  editJudge: (editedJudge: EditedJudge) => Promise<void>;
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
          await axios.post(`/api/judge/create/`, newJudge, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ judgeError: null });
        } catch (judgeError) {
          const errorMessage = "Error creating judge:" + judgeError;
          set({ judgeError: errorMessage });
          throw Error(errorMessage);
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
          set(() => ({
            judge: response.data.judge,
          }));
          set({ judgeError: null });
        } catch (judgeError) {
          const errorMessage = "Error editing judge:" + judgeError;
          set({ judgeError: errorMessage });
          throw Error(errorMessage);
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
