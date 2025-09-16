import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { User, UserRoleMapping } from "../../types";

interface MapUserRoleState {
  user: User | null;
  mappings: UserRoleMapping[];
  isLoadingUserRole: boolean;
  userRoleError: string | null;

  getUserByRole: (relatedId: number, roleType: number) => Promise<void>;
  clearUser: () => void;
  clearMappings: () => void;
}

const useUserRoleStore = create<MapUserRoleState>()(
  persist(
    (set) => ({
      user: null,
      mappings: [],
      isLoadingUserRole: false,
      userRoleError: null,

      clearUser: async () => {
        try {
          set({ user: null });
          set({ userRoleError: null });
        } catch (userRoleError) {
          set({
            userRoleError: "Error clearing out user in state",
          });
          throw new Error("Error clearing out user in state");
        }
      },

      clearMappings: async () => {
        try {
          set({ mappings: [] });
          set({ userRoleError: null });
        } catch (userRoleError) {
          set({
            userRoleError: "Error clearing out mappings in state",
          });
          throw new Error("Error clearing out mappings in state");
        }
      },

      getUserByRole: async (
        relatedId: number,
        roleType: number
      ): Promise<void> => {
        set({ isLoadingUserRole: true, userRoleError: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/userToRole/getUserByRole/${relatedId}/${roleType}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          set({ user: response.data.User, isLoadingUserRole: false });
          set({ userRoleError: null });
        } catch (userRoleError: any) {
          set({
            userRoleError: "Error fetching user by role",
            isLoadingUserRole: false,
          });
          throw new Error("Error fetching user by role");
        }
      },
    }),
    {
      name: "map-user-role-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useUserRoleStore;
