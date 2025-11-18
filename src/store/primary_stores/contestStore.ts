import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Contest, NewContest } from "../../types";
import useMapContestOrganizerStore from "../map_stores/mapContestToOrganizerStore";
import { useMapContestToTeamStore } from "../map_stores/mapContestToTeamStore";
import useMapContestJudgeStore from "../map_stores/mapContestToJudgeStore";
import { useMapClusterToContestStore } from "../map_stores/mapClusterToContestStore";
import { dispatchDataChange } from "../../utils/dataChangeEvents";

interface ContestState {
  allContests: Contest[];
  contest: Contest | null;
  isLoadingContest: boolean;
  contestError: string | null;
  fetchAllContests: (forceRefresh?: boolean) => Promise<void>;
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

      fetchAllContests: async (forceRefresh: boolean = false) => {
        const cachedContests = get().allContests;
        if (!forceRefresh && cachedContests && cachedContests.length > 0) {
          return;
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
        const cachedContest = get().contest;
        if (cachedContest && cachedContest.id === contestId) {
          return;
        }

        const cachedInAll = get().allContests.find(c => c.id === contestId);
        if (cachedInAll) {
          set({ contest: cachedInAll });
          return;
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
            contest: state.contest && state.contest.id === updatedContest.id ? updatedContest : state.contest,
            contestError: null,
          }));

          const { updateContestInMappings } = useMapContestOrganizerStore.getState();
          updateContestInMappings(updatedContest.id, updatedContest);

          const { updateContestInTeams } = useMapContestToTeamStore.getState();
          updateContestInTeams(updatedContest);

          const { updateContestInJudges } = useMapContestToJudgeStore.getState();
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
            contest: state.contest && state.contest.id === contestId ? null : state.contest,
            contestError: null,
          }));

          const { removeContestFromAllOrganizers } = useMapContestOrganizerStore.getState();
          removeContestFromAllOrganizers(contestId);

          const { removeContestFromTeams } = useMapContestToTeamStore.getState();
          removeContestFromTeams(contestId);

          const { removeContestFromJudges } = useMapContestJudgeStore.getState();
          removeContestFromJudges(contestId);

          const { removeContestFromClusters } = useMapClusterToContestStore.getState();
          removeContestFromClusters(contestId);

          dispatchDataChange({ type: 'contest', action: 'delete', id: contestId });
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
