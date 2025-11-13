import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Contest, NewContest } from "../../types";
import useMapContestOrganizerStore from "../map_stores/mapContestToOrganizerStore";
import { useMapContestToTeamStore } from "../map_stores/mapContestToTeamStore";
import useMapContestJudgeStore from "../map_stores/mapContestToJudgeStore";

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

      clearContest: () => {
        set({ contest: null, contestError: null });
      },

      clearAllContests: () => {
        set({ contest: null, contestError: null });
      },

      fetchAllContests: async () => {
        // Check cache first - if we already have contests, return early
        const cachedContests = get().allContests;
        if (cachedContests && cachedContests.length > 0) {
          return; // Use cached data
        }
        
        set({ isLoadingContest: true });
        try {
          const { data } = await api.get(`/api/contest/getAll/`);
          set({ allContests: data.Contests });
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
          const { data } = await api.get(`/api/contest/get/${contestId}/`);
          set({
            contest: data.Contest,
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
          const { data } = await api.post(`/api/contest/create/`, newContest);
          const createdContest: Contest = data.contest;
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
          const { data } = await api.post(`/api/contest/edit/`, editedContest);
          const updatedContest: Contest = data.Contest;
          
          set((state) => ({
            allContests: state.allContests.map((c) =>
              c.id === updatedContest.id ? updatedContest : c
            ),
            // Also update the contest object if it matches
            contest: state.contest && state.contest.id === updatedContest.id ? updatedContest : state.contest,
            contestError: null,
          }));

          // Update contest in all mappings (contestsByOrganizers, etc.)
          const { updateContestInMappings } = useMapContestOrganizerStore.getState();
          updateContestInMappings(updatedContest.id, updatedContest);

          // Update contest in mapContestToTeamStore so judge dashboard shows updated name
          const { updateContestInTeams } = useMapContestToTeamStore.getState();
          updateContestInTeams(updatedContest);

          // Update contest in mapContestToJudgeStore so judge dashboard shows updated name
          const { updateContestForJudge } = useMapContestJudgeStore.getState();
          updateContestForJudge(updatedContest);
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
          await api.delete(`/api/contest/delete/${contestId}/`);
          set((state) => ({
            allContests: state.allContests.filter((c) => c.id !== contestId),
            contestError: null,
          }));
          
          // Remove contest from all organizers' assigned contests
          const { removeContestFromAllOrganizers } = useMapContestOrganizerStore.getState();
          removeContestFromAllOrganizers(contestId);
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
