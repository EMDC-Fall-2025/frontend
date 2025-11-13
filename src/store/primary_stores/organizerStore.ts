import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import useMapContestOrganizerStore from "../map_stores/mapContestToOrganizerStore";
import { registerStoreSync } from "../utils/storageSync";

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
          const { data } = await api.get(`/api/organizer/getAll/`);
          set({
            allOrganizers: data.organizers,
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
          const { data } = await api.get(`/api/organizer/get/${organizerId}/`);
          set({ organizer: data.Organizer, organizerError: null });
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
          const { data } = await api.post(`/api/organizer/create/`, newOrganizer);
          // Extract organizer from response - backend returns { user, organizer, user_map }
          const apiOrganizer = data.organizer || data;
          const createdOrganizer: Organizer = {
            ...apiOrganizer,
            username: newOrganizer.username || data.user?.username || apiOrganizer.username || '',
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

          // Ensure id is included in the request body
          const payload = {
            id: editedOrganizer.id,
            first_name: editedOrganizer.first_name,
            last_name: editedOrganizer.last_name,
            username: editedOrganizer.username,
            password: editedOrganizer.password || "password", // Backend might need this
          };
          const { data } = await api.post(`/api/organizer/edit/`, payload);
          
          // Use the response data from backend to update state
          const updatedOrganizer = data.organizer || editedOrganizer;
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
          await api.delete(`/api/organizer/delete/${organizerId}/`);
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
          await api.post(`/api/organizer/disqualifyTeam/`, {
            teamid: teamId,
            organizer_disqualified: organizer_disqualified,
          });
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
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Register for global storage sync
registerStoreSync('organizer-storage', (state) => {
  useOrganizerStore.setState({
    allOrganizers: state.allOrganizers || [],
    organizer: state.organizer || null,
  });
});

export default useOrganizerStore;
