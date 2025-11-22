// ==============================
// Store: Tabulate Store
// Manages score tabulation operations for contests.
// Handles bulk score calculations and tabulation processes.
// ==============================

// ==============================
// Core Dependencies
// ==============================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ==============================
// API
// ==============================
import { api } from "../../lib/api";

// ==============================
// Types & Interfaces
// ==============================

interface TabulateState {
  // Tabulation operations
  tabulateContest: (contest_id: number) => Promise<void>;

  // Loading and error states
  isLoadingTabulate: boolean;
  tabulateError: string | null;

  // Utility functions
  clearTabulateError: () => void;
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
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
