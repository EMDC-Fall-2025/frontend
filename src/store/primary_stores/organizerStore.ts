// ==============================
// Store: Organizer Store
// Manages organizer data, CRUD operations, and team disqualification.
// Handles organizer-related state with data change synchronization.
// ==============================

// ==============================
// Core Dependencies
// ==============================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ==============================
// API & Utilities
// ==============================
import { api } from "../../lib/api";
import { dispatchDataChange } from "../../utils/dataChangeEvents";

// ==============================
// Related Store Imports
// ==============================
import useMapContestOrganizerStore from "../map_stores/mapContestToOrganizerStore";

// ==============================
// Types & Interfaces
// ==============================

interface Organizer {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  password?: string;
}

interface OrganizerState {
  // Organizer data
  allOrganizers: Organizer[];
  organizer: Organizer | null;

  // Loading and error states
  isLoadingOrganizer: boolean;
  organizerError: string | null;

  // CRUD operations
  fetchAllOrganizers: (forceRefresh?: boolean) => Promise<void>;
  fetchOrganizerById: (organizerId: number) => Promise<void>;
  createOrganizer: (newOrganizer: Omit<Organizer, "id">) => Promise<void>;
  editOrganizer: (editedOrganizer: Organizer) => Promise<void>;
  deleteOrganizer: (organizerId: number) => Promise<void>;

  // Business logic actions
  organizerDisqualifyTeam: (teamId: number, organizer_disqualified: boolean) => Promise<void>;

  // Utility functions
  clearOrganizer: () => void;
}

// ==============================
// Store Implementation
// ==============================

export const useOrganizerStore = create<OrganizerState>()(
  persist(
    (set, get) => ({
      // ==============================
      // Initial State
      // ==============================
      allOrganizers: [],
      organizer: null,
      isLoadingOrganizer: false,
      organizerError: null,

      // ==============================
      // Utility Functions
      // ==============================

      clearOrganizer: () => {
        set({ organizer: null, organizerError: null });
      },

      fetchAllOrganizers: async (forceRefresh: boolean = false) => {
        const cachedOrganizers = get().allOrganizers;
        if (!forceRefresh && cachedOrganizers && cachedOrganizers.length > 0) {
          return;
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
          const apiOrganizer = data.organizer || data;
          const createdOrganizer: Organizer = {
            ...apiOrganizer,
            username: newOrganizer.username || data.user?.username || apiOrganizer.username || '',
          };
          set((state) => ({
            allOrganizers: [...state.allOrganizers, createdOrganizer],
            organizerError: null,
          }));
          if (createdOrganizer?.id) {
            dispatchDataChange({ type: 'organizer', action: 'create', id: createdOrganizer.id });
          }
        } catch (error: any) {
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
          const state = get();
          const oldOrganizer = state.allOrganizers.find((org) => org.id === editedOrganizer.id);
          const oldName = oldOrganizer
            ? `${oldOrganizer.first_name} ${oldOrganizer.last_name}`.trim()
            : null;

          const payload = {
            id: editedOrganizer.id,
            first_name: editedOrganizer.first_name,
            last_name: editedOrganizer.last_name,
            username: editedOrganizer.username,
            password: editedOrganizer.password || "password",
          };
          const { data } = await api.post(`/api/organizer/edit/`, payload);

          const updatedOrganizer = data.organizer || editedOrganizer;
          const finalOrganizer: Organizer = {
            ...updatedOrganizer,
            username: editedOrganizer.username,
          };

          const newName = `${finalOrganizer.first_name} ${finalOrganizer.last_name}`.trim();

          set((state) => ({
            allOrganizers: state.allOrganizers.map((org) =>
              org.id === editedOrganizer.id ? finalOrganizer : org
            ),
            organizerError: null,
          }));

          if (oldName && newName && oldName !== newName) {
            const { updateOrganizerNameInContests } = useMapContestOrganizerStore.getState();
            updateOrganizerNameInContests(editedOrganizer.id, oldName, newName);
          }
          if (finalOrganizer?.id) {
            dispatchDataChange({ type: 'organizer', action: 'update', id: finalOrganizer.id });
          }
        } catch (error: any) {
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
          set((state) => ({
            allOrganizers: state.allOrganizers.filter(
              (org) => org.id !== organizerId
            ),
            organizerError: null,
          }));
          dispatchDataChange({ type: 'organizer', action: 'delete', id: organizerId });
        } catch (error: any) {
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
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useOrganizerStore;
