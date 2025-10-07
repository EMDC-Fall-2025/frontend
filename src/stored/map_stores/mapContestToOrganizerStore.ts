import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Contest, Organizer } from "../../types";

interface MapContestOrganizerState {
  contests: Contest[];
  organizers: Organizer[];
  contestsByOrganizers: Record<number, Contest[] | null>;
  organizerNamesByContests: Record<number, string[] | []>;
  isLoadingMapContestOrganizer: boolean;
  mapContestOrganizerError: null | string;
  createContestOrganizerMapping: (
    organizerId: number,
    contestId: number
  ) => Promise<void>;
  deleteContestOrganizerMapping: (
    organizerId: number,
    contestId: number
  ) => Promise<void>;
  fetchContestsByOrganizerId: (organizerId: number) => Promise<void>;
  fetchContestsByOrganizers: () => Promise<void>;
  fetchOrganizersByContestId: (contestId: number) => Promise<void>;
  fetchOrganizerNamesByContests: () => Promise<void>;
  clearContests: () => void;
  clearOrganizers: () => void;
  clearMapContestOrganizerError: () => void;
}

export const useMapContestOrganizerStore = create<MapContestOrganizerState>()(
  persist(
    (set) => ({
      contests: [],
      organizers: [],
      isLoadingMapContestOrganizer: false,
      mapContestOrganizerError: null,
      contestsByOrganizers: {},
      organizerNamesByContests: {},

      clearMapContestOrganizerError: async () => {
        set({ mapContestOrganizerError: null });
      },

      clearContests: async () => {
        try {
          set({ contests: [] });
          set({ mapContestOrganizerError: null });
        } catch (error) {
          set({
            mapContestOrganizerError: "Error clearing out contests in state",
          });
          throw new Error("Error clearing out contests in state");
        }
      },

      clearOrganizers: async () => {
        try {
          set({ organizers: [] });
          set({ mapContestOrganizerError: null });
        } catch (error) {
          set({
            mapContestOrganizerError: "Error clearing out organizers in state",
          });
          throw new Error("Error clearing out organizers in state");
        }
      },

      createContestOrganizerMapping: async (
        organizerId: number,
        contestId: number
      ) => {
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });

        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/contestToOrganizer/create/`,
            { contestid: contestId, organizerid: organizerId },
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          set({
            contests: response.data.Contests,
          });
          set({ mapContestOrganizerError: null });
        } catch (error) {
          const errorMessage = "Error creating organizer contest mapping";
          set({ mapContestOrganizerError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestOrganizer: false });
        }
      },
      deleteContestOrganizerMapping: async (
        organizerId: number,
        contestId: number
      ) => {
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });

        try {
          const token = localStorage.getItem("token");
          await axios.delete(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/contestToOrganizer/delete/${organizerId}/${contestId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          set({ mapContestOrganizerError: null });
        } catch (error) {
          const errorMessage = "Error deleting organizer contest mapping";
          set({ mapContestOrganizerError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestOrganizer: false });
        }
      },

      fetchContestsByOrganizerId: async (organizerId: number) => {
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });

        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          set({
            contests: response.data.Contests,
          });
          set({ mapContestOrganizerError: null });
        } catch (error) {
          const errorMessage = "Error fetching contests";
          set({ mapContestOrganizerError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestOrganizer: false });
        }
      },
      fetchOrganizersByContestId: async (contestId: number) => {
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/organizerToContest/getOrganizersByContest/${contestId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          set({
            organizers: response.data.Organizers,
          });
          set({ mapContestOrganizerError: null });
        } catch (error) {
          const errorMessage = "Error fetching organizers";
          set({ mapContestOrganizerError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestOrganizer: false });
        }
      },
      fetchContestsByOrganizers: async () => {
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/contestToOrganizer/getAllContestsPerOrganizer/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          set({
            contestsByOrganizers: response.data,
          });
          // Process response data
          set({ mapContestOrganizerError: null });
        } catch (error) {
          const errorMessage = "Error fetching organizers";
          set({ mapContestOrganizerError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestOrganizer: false });
        }
      },
      fetchOrganizerNamesByContests: async () => {
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/mapping/contestToOrganizer/getOrganizerNames/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );

          const responseData = response.data;

          // Ensure all contests are included in the state, even with an empty array
          const processedData: Record<number, string[]> = {};
          Object.keys(responseData).forEach((key) => {
            processedData[parseInt(key)] = responseData[key] || [];
          });

          set({
            organizerNamesByContests: processedData,
          });
          set({ mapContestOrganizerError: null });
        } catch (error) {
          const errorMessage = "Error fetching organizers";
          set({ mapContestOrganizerError: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoadingMapContestOrganizer: false });
        }
      },
    }),
    {
      name: "contest-organizer-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useMapContestOrganizerStore;
