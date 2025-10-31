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
  removeJudgeFromContest: (judgeId: number, contestId: number) => Promise<void>;
  clearJudges: () => void;
  clearContest: () => void;
  clearMappings: () => void;
  clearContestJudges: () => Promise<void>;
  fetchJudgesForMultipleContests: (contestIds: number[]) => Promise<void>;
}

export const useMapContestJudgeStore = create<MapContestJudgeState>()(
  persist(
    (set, get) => ({
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
        // Check cache first - if we already have judges for this contest, return early
        const cachedJudges = get().contestJudges[contestId];
        if (cachedJudges && cachedJudges.length > 0) {
          set({ judges: cachedJudges });
          return; // Use cached data
        }
        
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
          // Update judges and contestJudges map
          const judges = response.data.Judges || [];
          set({
            judges: judges,
            contestJudges: {
              ...get().contestJudges,
              [contestId]: judges,
            },
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
        // Check cache first - if we already have this contest, return early
        const cachedContest = get().contest;
        if (cachedContest) {
          return; // Use cached data
        }
        
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
        } catch (error: any) {
          console.error('Error fetching contest by judge ID:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
          const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Error fetching contest by judge ID";
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

      removeJudgeFromContest: async (judgeId: number, contestId: number) => {
        set({ isLoadingMapContestJudge: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/mapping/contestToJudge/remove/${judgeId}/${contestId}/`, {
            headers: { Authorization: `Token ${token}` },
          });
          set({ mapContestJudgeError: null });
        } catch (error) {
          const errorMessage = "Error removing judge from contest";
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
        // Check cache first - only fetch for contests we don't have data for
        const cachedContestJudges = get().contestJudges;
        const contestJudgesMap: {[contestId: number]: Judge[]} = { ...cachedContestJudges };
        const contestsToFetch = contestIds.filter(id => !cachedContestJudges[id] || cachedContestJudges[id].length === 0);
        
        // If all contests are cached, return early
        if (contestsToFetch.length === 0) {
          return; // Use cached data
        }
        
        set({ isLoadingMapContestJudge: true });
        try {
          for (const contestId of contestsToFetch) {
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
            } catch (error) {
              console.warn(`Failed to fetch judges for contest ${contestId}`);
              contestJudgesMap[contestId] = [];
            }
          }
          
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
