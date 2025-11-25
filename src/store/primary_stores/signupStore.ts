// ==============================
// Store: Signup Store
// Manages user registration and account creation.
// Handles signup authentication and user creation flow.
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

interface SignupState {
  // User data
  user: null | { id: number; username: string };

  // Loading and error states
  authError: string | null;
  isLoadingSignup: boolean;

  // Authentication operations
  signup: (username: string, password: string) => Promise<void>;
}

export const useSignupStore = create<SignupState>()(
  persist(
    (set) => ({
      user: null,
      authError: null,
      isLoadingSignup: false,

      signup: async (username, password) => {
        set({ isLoadingSignup: true, authError: null });
        try {
          const { data } = await api.post(`/api/signup/`, {
            username,
            password,
          });

          set({
            user: data.user,
            isLoadingSignup: false,
          });
        } catch (authError: any) {
          set({ isLoadingSignup: false, authError: "Signup Unsuccessful" });
          throw authError;
        }
      },
    }),
    {
      name: "signup-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
