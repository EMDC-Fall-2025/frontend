import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";

interface SignupState {
  user: null | { id: number; username: string };
  authError: string | null;
  isLoadingSignup: boolean;
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
