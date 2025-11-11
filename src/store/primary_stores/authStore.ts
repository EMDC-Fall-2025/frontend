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
  logout: () => Promise<void>;
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
        set({ isLoadingAuth: true });
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
          set({ isLoadingAuth: false });
          set({ authError: "Login Unsuccessful" });
          throw authError;
        }
      },

      logout: async () => {
        try {
          await api.post(`/api/logout/`, {});
        } finally {
          set({ user: null, role: null, isAuthenticated: false });
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
