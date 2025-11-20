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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      authError: null,
      isAuthenticated: false,
      isLoadingAuth: false,

      login: async (username, password) => {
        set({ isLoadingAuth: true, authError: null });

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
            authError: null,
          });
        } catch (authError: any) {
          console.error("Login error:", authError);
          set({
            isLoadingAuth: false,
            isAuthenticated: false,
            role: null,
            authError: "Login failed",
          });
          throw authError;
        }
      },

      logout: () => {
        // Clear authentication state immediately for instant UI update
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoadingAuth: false,
          authError: null,
        });
        sessionStorage.clear();

        try {
          // Make logout API call (don't block UI on this)
          api.post(`/api/logout/`, {});
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
