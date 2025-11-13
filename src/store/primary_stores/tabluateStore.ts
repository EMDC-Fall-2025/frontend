import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";

interface TabulateState {
  tabulateContest: (contest_id: number) => Promise<void>;
  clearTabulateError: () => void;
  isLoadingTabulate: boolean;
  tabulateError: string | null;
}

export const useTabulateStore = create<TabulateState>()(
  persist(
    (set) => ({
      isLoadingTabulate: false,
      tabulateError: null,

      clearTabulateError: async () => {
        set({ tabulateError: null });
      },

      tabulateContest: async (contest_id: number) => {
        set({ isLoadingTabulate: true });
        try {
          await api.put(
            `/api/tabulation/tabulateScores/`,
            { contestid: contest_id }
          );
          set({ tabulateError: null });
        } catch (tabulateError: any) {
          set({ tabulateError: "Failure tabulating contest" });
          throw new Error("Failure tabulating contest");
        } finally {
          set({ isLoadingTabulate: false });
        }
      },
    }),
    {
      name: "tabulate-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
