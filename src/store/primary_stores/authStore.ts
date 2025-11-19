import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Role } from "../../types";

interface AuthState {
  user: null | { id: number; username: string };
  role: null | Role;
  authError: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  showPreloader: boolean; // Track if we should show preloader after login
  preloaderProgress: string; // Progress message to show in preloader
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setShowPreloader: (show: boolean) => void;
  setPreloaderProgress: (progress: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      authError: null,
      isAuthenticated: false,
      isLoadingAuth: false,
      showPreloader: false,
      preloaderProgress: '',

      setShowPreloader: (show: boolean) => {
        set({ showPreloader: show });
      },

      setPreloaderProgress: (progress: string) => {
        set({ preloaderProgress: progress });
      },

      login: async (username, password) => {
        set({ isLoadingAuth: true, showPreloader: true }); // Show preloader immediately
        set({ authError: null });

        try {
          const { data } = await api.post(`/api/login/`, {
            username,
            password,
          });

          set({
            user: data.user,
            role: data.role ?? null,
            isAuthenticated: true,
            isLoadingAuth: false,
          });
          set({ authError: null });
        } catch (authError: any) {
          set({ isLoadingAuth: false, showPreloader: false });
          set({ authError: "Login Unsuccessful" });
          throw authError;
        }
      },

      logout: async () => {
        // Clear authentication state immediately for instant UI update
        set({ user: null, role: null, isAuthenticated: false, showPreloader: false, preloaderProgress: '' });
        sessionStorage.clear();

        try {
          // Make logout API call (don't block UI on this)
          await api.post(`/api/logout/`, {});
        } catch (error) {
          // Even if logout API fails, user is already logged out locally
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
