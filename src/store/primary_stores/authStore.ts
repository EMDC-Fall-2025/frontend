// ==============================
// Store: Authentication Store
// Manages user authentication state, login/logout functionality, and session persistence.
// Includes preloader state management for login experience.
// ==============================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { api } from "../../lib/api";
import { Role } from "../../types";

interface AuthState {
  // User authentication data
  user: null | { id: number; username: string };
  role: null | Role;

  // Authentication state flags
  authError: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;

  // Preloader state for login experience
  showPreloader: boolean;      // Track if we should show preloader
  preloaderProgress: string;   // Progress message to show in preloader

  // Authentication actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setShowPreloader: (show: boolean) => void;
  setPreloaderProgress: (progress: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ==============================
      // Initial State
      // ==============================
      user: null,
      role: null,
      authError: null,
      isAuthenticated: false,
      isLoadingAuth: false,
      showPreloader: false,
      preloaderProgress: "",

      // ==============================
      // Preloader Actions
      // ==============================
      setShowPreloader: (show: boolean) => {
        set({ showPreloader: show });
      },

      setPreloaderProgress: (progress: string) => {
        set({ preloaderProgress: progress });
      },

      // ==============================
      // Authentication Actions
      // ==============================
      login: async (username, password) => {
        // Show preloader while auth is in progress
        set({
          isLoadingAuth: true,
          showPreloader: true,
          authError: null,
        });

        try {
          // NOTE: keep this path consistent with your backend (you had /api/login/ before)
          const { data } = await api.post(`/api/login/`, {
            username,
            password,
          });

          set({
            user: data.user,
            role: data.role ?? null,
            isAuthenticated: true,
            isLoadingAuth: false,
            showPreloader: false,   
            preloaderProgress: "",
            authError: null,
          });
        } catch (authError: any) {
          set({
            isLoadingAuth: false,
            showPreloader: false,   
            authError: "Login Unsuccessful",
          });
          throw authError;
        }
      },

      logout: async () => {
        // Clear authentication state immediately for instant UI update
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          showPreloader: false,
          preloaderProgress: "",
          authError: null,
        });
        sessionStorage.clear();

        try {
          await api.post(`/api/logout/`, {});
        } catch (error) {
          console.error("Logout API error:", error);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);