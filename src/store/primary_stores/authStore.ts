import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Role } from "../../types";
const API_BASE_URL = (import.meta as any).env.VITE_BACKEND_URL;

interface AuthState {
  user: null | { id: number; username: string };
  role: null | Role;
  authError: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  token: null | string;
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
      token: null,
      
      login: async (username, password) => {
        set({ isLoadingAuth: true });
        set({ authError: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/api/login/`, {
            username: username,
            password: password,
          });

          const { token, user, role } = response.data;
          localStorage.setItem("token", token);

          set({
            user,
            role,
            token,
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

      logout: () => {
        set({ user: null, role: null, isAuthenticated: false, token: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
