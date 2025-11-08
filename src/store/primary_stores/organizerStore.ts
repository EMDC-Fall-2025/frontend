import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import useMapContestOrganizerStore from "../map_stores/mapContestToOrganizerStore";

interface Organizer {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  password?: string;
}

interface OrganizerState {
  allOrganizers: Organizer[];
  organizer: Organizer | null;
  isLoadingOrganizer: boolean;
  organizerError: string | null;
  fetchAllOrganizers: (forceRefresh?: boolean) => Promise<void>;
  fetchOrganizerById: (organizerId: number) => Promise<void>;
  createOrganizer: (newOrganizer: Omit<Organizer, "id">) => Promise<void>;
  editOrganizer: (editedOrganizer: Organizer) => Promise<void>;
  deleteOrganizer: (organizerId: number) => Promise<void>;
  organizerDisqualifyTeam: (
    teamId: number,
    organizer_disqualified: boolean
  ) => Promise<void>;
  clearOrganizer: () => void;
}

export const useOrganizerStore = create<OrganizerState>()(
  persist(
    (set, get) => ({
      allOrganizers: [],
      organizer: null,
      isLoadingOrganizer: false,
      organizerError: null,

      clearOrganizer: () => {
        set({ organizer: null, organizerError: null });
      },

      fetchAllOrganizers: async (forceRefresh: boolean = false) => {
        // Check cache first - if we already have organizers and not forcing refresh, return early
        const cachedOrganizers = get().allOrganizers;
        if (!forceRefresh && cachedOrganizers && cachedOrganizers.length > 0) {
          return; // Use cached data
        }
        
        set({ isLoadingOrganizer: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/organizer/getAll/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          });
          set({
            allOrganizers: response.data.organizers,
            organizerError: null,
          });
        } catch (error) {
          set({ organizerError: "Error fetching organizers: " + error });
          throw new Error("Error fetching organizers: " + error);
        } finally {
          set({ isLoadingOrganizer: false });
        }
      },

      fetchOrganizerById: async (organizerId: number) => {
        set({ isLoadingOrganizer: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/organizer/get/${organizerId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          set({ organizer: response.data.Organizer, organizerError: null });
        } catch (error) {
          set({ organizerError: "Error fetching organizer: " + error });
          throw new Error("Error fetching organizer: " + error);
        } finally {
          set({ isLoadingOrganizer: false });
        }
      },

      createOrganizer: async (newOrganizer: Omit<Organizer, "id">) => {
        set({ isLoadingOrganizer: true });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/organizer/create/`,
            newOrganizer,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          // Extract organizer from response - backend returns { user, organizer, user_map }
          const apiOrganizer = response.data.organizer || response.data;
          const createdOrganizer: Organizer = {
            ...apiOrganizer,
            username: newOrganizer.username || response.data.user?.username || apiOrganizer.username || '',
          };
          set((state) => ({
            allOrganizers: [...state.allOrganizers, createdOrganizer],
            organizerError: null,
          }));
        } catch (error: any) {
          // Convert error to string to prevent React rendering issues
          let errorMessage = "Error creating organizer";
          if (error?.response?.data) {
            const data = error.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.error && typeof data.error === 'string') {
              errorMessage = data.error;
            } else if (data.detail && typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (data.message && typeof data.message === 'string') {
              errorMessage = data.message;
            } else {
              errorMessage = JSON.stringify(data);
            }
          }
          set({ organizerError: errorMessage });
          throw error; 
        } finally {
          set({ isLoadingOrganizer: false });
        }
      },

      editOrganizer: async (editedOrganizer: Organizer) => {
        set({ isLoadingOrganizer: true });
        try {
          // Get the old organizer name before editing
          const state = get();
          const oldOrganizer = state.allOrganizers.find((org) => org.id === editedOrganizer.id);
          const oldName = oldOrganizer 
            ? `${oldOrganizer.first_name} ${oldOrganizer.last_name}`.trim()
            : null;

          const token = localStorage.getItem("token");
          // Ensure id is included in the request body
          const payload = {
            id: editedOrganizer.id,
            first_name: editedOrganizer.first_name,
            last_name: editedOrganizer.last_name,
            username: editedOrganizer.username,
            password: editedOrganizer.password || "password", // Backend might need this
          };
          const response = await axios.post(`/api/organizer/edit/`, payload, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          // Use the response data from backend to update state
          const updatedOrganizer = response.data.organizer || editedOrganizer;
          const finalOrganizer: Organizer = {
            ...updatedOrganizer,
            username: editedOrganizer.username, // Preserve username from request
          };
          
          // Calculate new name
          const newName = `${finalOrganizer.first_name} ${finalOrganizer.last_name}`.trim();
          
          set((state) => ({
            allOrganizers: state.allOrganizers.map((org) =>
              org.id === editedOrganizer.id ? finalOrganizer : org
            ),
            organizerError: null,
          }));

          // Update organizer name in contest mappings if name changed
          if (oldName && newName && oldName !== newName) {
            const { updateOrganizerNameInContests } = useMapContestOrganizerStore.getState();
            updateOrganizerNameInContests(editedOrganizer.id, oldName, newName);
          }
        } catch (error: any) {
          // Convert error to string to prevent React rendering issues
          let errorMessage = "Error editing organizer";
          if (error?.response?.data) {
            const data = error.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.error && typeof data.error === 'string') {
              errorMessage = data.error;
            } else if (data.detail && typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (data.message && typeof data.message === 'string') {
              errorMessage = data.message;
            } else {
              errorMessage = JSON.stringify(data);
            }
          }
          set({ organizerError: errorMessage });
          throw error; 
        } finally {
          set({ isLoadingOrganizer: false });
        }
      },

      deleteOrganizer: async (organizerId: number) => {
        set({ isLoadingOrganizer: true });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/organizer/delete/${organizerId}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          // Only update state if deletion succeeds
          set((state) => ({
            allOrganizers: state.allOrganizers.filter(
              (org) => org.id !== organizerId
            ),
            organizerError: null,
          }));
        } catch (error: any) {
          // Extract error message from backend response
          let errorMessage = "Error deleting organizer";
          if (error?.response?.data) {
            const data = error.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.error && typeof data.error === 'string') {
              errorMessage = data.error;
            } else if (data.detail && typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (data.message && typeof data.message === 'string') {
              errorMessage = data.message;
            } else {
              errorMessage = JSON.stringify(data);
            }
          }
          set({ organizerError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingOrganizer: false });
        }
      },

      organizerDisqualifyTeam: async (
        teamId: number,
        organizer_disqualified: boolean
      ) => {
        set({ isLoadingOrganizer: true });
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/organizer/disqualifyTeam/`,
            { teamid: teamId, organizer_disqualified: organizer_disqualified },
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          set({ organizerError: null });
        } catch (error) {
          set({
            organizerError: "Error organizer disqualifying team: " + error,
          });
          throw new Error("Error organizer disqualifying team: " + error);
        } finally {
          set({ isLoadingOrganizer: false });
        }
      },
    }),
    {
      name: "organizer-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useOrganizerStore;
