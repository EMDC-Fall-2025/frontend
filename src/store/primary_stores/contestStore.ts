import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Contest, NewContest } from "../../types";

interface ContestState {
  allContests: Contest[];
  contest: Contest | null;
  isLoadingContest: boolean;
  contestError: string | null;
  fetchAllContests: () => Promise<void>;
  fetchContestById: (contestId: number) => Promise<void>;
  createContest: (newContest: NewContest) => Promise<void>;
  editContest: (editedContest: Contest) => Promise<void>;
  deleteContest: (contestId: number) => Promise<void>;
  clearContest: () => void;
}

export const useContestStore = create<ContestState>()(
  persist(
    (set, get) => ({
      allContests: [],
      contest: null,
      isLoadingContest: false,
      contestError: null,

      clearContest: async () => {
        try {
          set({ contest: null });
          set({ contestError: null });
        } catch (contestError) {
          set({ contestError: "Error clearing out contest in state" });
          throw Error("Error clearing out contest in state");
        }
      },

      clearAllContests: async () => {
        try {
          set({ contest: null });
          set({ contestError: null });
        } catch (contestError) {
          set({ contestError: "Error clearing out allContests in state" });
          throw Error("Error clearing out allContests in state");
        }
      },

      fetchAllContests: async () => {
        // Check cache first - if we already have contests, return early
        const cachedContests = get().allContests;
        if (cachedContests && cachedContests.length > 0) {
          return; // Use cached data
        }
        
        set({ isLoadingContest: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/contest/getAll/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set({ allContests: response.data.Contests });
          set({ contestError: null });
        } catch (contestError) {
          set({ contestError: "Error fetching contests: " + contestError });
          throw Error("Error fetching contests: " + contestError);
        } finally {
          set({ isLoadingContest: false });
        }
      },

      fetchContestById: async (contestId: number) => {
        // Check cache first - if we already have this contest, return early
        const cachedContest = get().contest;
        if (cachedContest && cachedContest.id === contestId) {
          return; // Use cached data
        }
        
        // Also check allContests array for the contest
        const cachedInAll = get().allContests.find(c => c.id === contestId);
        if (cachedInAll) {
          set({ contest: cachedInAll });
          return; // Use cached data
        }
        
        set({ isLoadingContest: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/contest/get/${contestId}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set({
            contest: response.data.Contest,
          });
          set({ contestError: null });
        } catch (contestError) {
          set({ contestError: "Error fetching contest: " + contestError });
          throw Error("Error fetching contest: " + contestError);
        } finally {
          set({ isLoadingContest: false });
        }
      },

      createContest: async (newContest: NewContest) => {
        set({ isLoadingContest: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/contest/create/`,
            newContest,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          const createdContest: Contest = response.data;
          set((state) => ({
            allContests: [...state.allContests, createdContest],
            contestError: null,
          }));
        } catch (contestError) {
          set({ contestError: "Error creating contest: " + contestError });
          throw Error("Error creating contest: " + contestError);
        } finally {
          set({ isLoadingContest: false });
        }
      },

      editContest: async (editedContest: Contest) => {
        set({ isLoadingContest: true });
        try {
          const token = localStorage.getItem("token");
          await axios.post(`/api/contest/edit/`, editedContest, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ contestError: null });
        } catch (contestError) {
          set({ contestError: "Error editing contest: " + contestError });
          throw Error("Error editing contest: " + contestError);
        } finally {
          set({ isLoadingContest: false });
        }
      },

      deleteContest: async (contestId: number) => {
        set({ isLoadingContest: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/contest/delete/${contestId}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          set({ contestError: null });
        } catch (contestError) {
          set({ contestError: "Error deleting contest: " + contestError });
          throw Error("Error deleting contest: " + contestError);
        } finally {
          set({ isLoadingContest: false });
        }
      },
    }),
    {
      name: "contest-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useContestStore;
