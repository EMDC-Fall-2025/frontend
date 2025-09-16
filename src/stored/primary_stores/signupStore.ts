import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

interface SignupState {
  user: null | { id: number; username: string };
  authError: string | null;
  isLoadingSignup: boolean;
  token: null | string;
  signup: (username: string, password: string) => Promise<void>;
}

export const useSignupStore = create<SignupState>()(
  persist(
    (set) => ({
      user: null,
      authError: null,
      isLoadingSignup: false,
      token: null,

      signup: async (username, password) => {
        set({ isLoadingSignup: true, authError: null });
        try {
          const response = await axios.post(`/api/signup/`, {
            username: username,
            password: password,
          });

          const { token, user } = response.data;
          localStorage.setItem("token", token);

          set({
            user,
            token,
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
    }
  )
);
