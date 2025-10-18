import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Contest, Judge, MapContestToJudge } from "../../types";

interface MapContestJudgeState {
  judges: Judge[];
  contest: Contest | null;
  mappings: MapContestToJudge[];
  contestJudges: {[contestId: number]: Judge[]};
  isLoadingMapContestJudge: boolean;
  mapContestJudgeError: string | null;

  createContestJudgeMapping: (mapData: MapContestToJudge) => Promise<void>;
  getAllJudgesByContestId: (contestId: number) => Promise<void>;
  getContestByJudgeId: (judgeId: number) => Promise<void>;
  deleteContestJudgeMappingById: (mapId: number) => Promise<void>;
  clearJudges: () => void;
  clearContest: () => void;
  clearMappings: () => void;
  clearContestJudges: () => Promise<void>;
  fetchJudgesForMultipleContests: (contestIds: number[]) => Promise<void>;
}

export const useMapContestJudgeStore = create<MapContestJudgeState>()(
  persist(
    (set) => ({
      judges: [],
      contest: null,
      mappings: [],
      contestJudges: {},
      isLoadingMapContestJudge: false,
      mapContestJudgeError: null,

      clearJudges: async () => {
        try {
          set({ judges: [] });
          set({ mapContestJudgeError: null });
        } catch (error) {
          const errorMessage = "Error clearing out judges in state";
          set({ mapContestJudgeError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      clearContest: async () => {
        try {
          set({ contest: null });
          set({ mapContestJudgeError: null });
        } catch (error) {
          const errorMessage = "Error clearing out contest in state";
          set({ mapContestJudgeError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      clearMappings: async () => {
        try {
          set({ mappings: [] });
          set({ mapContestJudgeError: null });
        } catch (error) {
          const errorMessage = "Error clearing out mappings in state";
          set({ mapContestJudgeError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      createContestJudgeMapping: async (mapData: MapContestToJudge) => {
        set({ isLoadingMapContestJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/mapping/contestToJudge/create/`,
            mapData,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set((state) => ({
            mappings: [...state.mappings, response.data],
          }));
          set({ mapContestJudgeError: null });
        } catch (error) {
          const errorMessage = "Error creating contest-judge mapping";
          set({ mapContestJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestJudge: false });
        }
      },

      getAllJudgesByContestId: async (contestId: number) => {
        set({ isLoadingMapContestJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/judgeToContest/getAllJudges/${contestId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          // Update judges and clear error in a single set call to prevent multiple re-renders
          set({
            judges: response.data.Judges,
            mapContestJudgeError: null,
            isLoadingMapContestJudge: false,
          });
        } catch (error) {
          const errorMessage = "Error fetching judges by contest ID";
          set({ 
            mapContestJudgeError: errorMessage,
            isLoadingMapContestJudge: false,
          });
          throw new Error(errorMessage);
        }
      },

      getContestByJudgeId: async (judgeId: number) => {
        set({ isLoadingMapContestJudge: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/contestToJudge/getContestByJudge/${judgeId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          set({
            contest: response.data.Contest,
          });
          set({ mapContestJudgeError: null });
        } catch (error) {
          const errorMessage = "Error fetching contest by judge ID";
          set({ mapContestJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestJudge: false });
        }
      },

      deleteContestJudgeMappingById: async (mapId: number) => {
        set({ isLoadingMapContestJudge: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/mapping/contestToJudge/delete/${mapId}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set((state) => ({
            mappings: state.mappings.filter((mapping) => mapping.id !== mapId),
          }));
          set({ mapContestJudgeError: null });
        } catch (error) {
          const errorMessage = "Error deleting contest-judge mapping";
          set({ mapContestJudgeError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestJudge: false });
        }
      },

      clearContestJudges: async () => {
        try {
          set({ contestJudges: {} });
          set({ mapContestJudgeError: null });
        } catch (error) {
          const errorMessage = "Error clearing contest judges";
          set({ mapContestJudgeError: errorMessage });
          throw new Error(errorMessage);
        }
      },

      fetchJudgesForMultipleContests: async (contestIds: number[]) => {
        console.log('Store: fetchJudgesForMultipleContests called with:', contestIds);
        set({ isLoadingMapContestJudge: true });
        try {
          const contestJudgesMap: {[contestId: number]: Judge[]} = {};
          
          for (const contestId of contestIds) {
            try {
              const token = localStorage.getItem("token");
              const response = await axios.get(
                `/api/mapping/judgeToContest/getAllJudges/${contestId}/`,
                {
                  headers: {
                    Authorization: `Token ${token}`,
                  },
                }
              );
              contestJudgesMap[contestId] = response.data.Judges || [];
              console.log(`Store: Fetched ${response.data.Judges?.length || 0} judges for contest ${contestId}`);
            } catch (error) {
              console.warn(`Failed to fetch judges for contest ${contestId}`);
              contestJudgesMap[contestId] = [];
            }
          }
          
          console.log('Store: Setting contestJudges to:', contestJudgesMap);
          set({ 
            contestJudges: contestJudgesMap,
            mapContestJudgeError: null,
            isLoadingMapContestJudge: false,
          });
        } catch (error) {
          const errorMessage = "Error fetching judges for multiple contests";
          set({ 
            mapContestJudgeError: errorMessage,
            isLoadingMapContestJudge: false,
          });
          throw new Error(errorMessage);
        }
      },
    }),
    {
      name: "map-contest-judge-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useMapContestJudgeStore;
