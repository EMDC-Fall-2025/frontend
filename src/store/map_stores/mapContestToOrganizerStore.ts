import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../../lib/api";
import { Contest, Organizer } from "../../types";
import useContestStore from "../primary_stores/contestStore";
import useOrganizerStore from "../primary_stores/organizerStore";
import { dispatchDataChange } from "../../utils/dataChangeEvents";

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
  addContestToOrganizer: (organizerId: number, contest: Contest) => void;
  removeContestFromOrganizer: (organizerId: number, contestId: number) => void;
  removeOrganizerFromAllContests: (organizerId: number, organizerName: string) => void;
  removeContestFromAllOrganizers: (contestId: number) => void;
  updateOrganizerNameInContests: (organizerId: number, oldName: string, newName: string) => void;
  updateContestInMappings: (contestId: number, updatedContest: Contest) => void;
  clearContests: () => void;
  clearOrganizers: () => void;
  clearMapContestOrganizerError: () => void;
}

export const useMapContestOrganizerStore = create<MapContestOrganizerState>()(
  persist(
    (set, get) => ({
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
          mapContestOrganizerError: null,
        });

        try {
          await api.post(`/api/mapping/contestToOrganizer/create/`, {
            contestid: contestId,
            organizerid: organizerId,
          });
          // Get the contest from contest store and update directly
          const allContests = useContestStore.getState().allContests;
          const contest = allContests.find((c: Contest) => c.id === contestId);
          
          // Get organizer from organizer store
          const allOrganizers = useOrganizerStore.getState().allOrganizers;
          const organizer: any = allOrganizers.find((o: any) => o.id === organizerId);
          
          // If organizer not in store, fetch it
          let organizerName: string | null = null;
          if (organizer) {
            organizerName = `${organizer.first_name} ${organizer.last_name}`.trim();
          } else if (organizerId) {
            try {
              const organizerResponse = await api.get(`/api/organizer/get/${organizerId}/`);
              const fetchedOrganizer = organizerResponse.data.organizer || organizerResponse.data;
              if (fetchedOrganizer) {
                organizerName = `${fetchedOrganizer.first_name} ${fetchedOrganizer.last_name}`.trim();
              }
            } catch (err) {
              console.warn("Could not fetch organizer details");
            }
          }
          
            if (contest) {
              set((state) => {
              const currentContests = state.contestsByOrganizers[organizerId] || [];
              const currentOrganizerNames = (state.organizerNamesByContests[contestId] || []) as string[];
              
              const updates: Partial<MapContestOrganizerState> = {};
              
              // Check if contest is already in the list to avoid duplicates
              if (!currentContests.some((c: Contest) => c.id === contestId)) {
                updates.contestsByOrganizers = {
                  ...state.contestsByOrganizers,
                  [organizerId]: [...currentContests, contest],
                };
              }
              
              // Update organizer names for the contest
              if (organizerName && !currentOrganizerNames.includes(organizerName)) {
                updates.organizerNamesByContests = {
                  ...state.organizerNamesByContests,
                  [contestId]: [...currentOrganizerNames, organizerName],
                };
              }
              
              return Object.keys(updates).length > 0 ? updates : state;
            });
          }
          
          // Dispatch data change event for contest update 
          dispatchDataChange({ type: 'contest', action: 'update', id: contestId });
          
          set({ mapContestOrganizerError: null });
        } catch (error) {
          const errorMessage = "Error creating organizer contest mapping";
          set({ mapContestOrganizerError: errorMessage });
          throw new Error(errorMessage);
        }
      },
      deleteContestOrganizerMapping: async (
        organizerId: number,
        contestId: number
      ) => {
        set({
          mapContestOrganizerError: null,
        });

        try {
          await api.delete(`/api/mapping/contestToOrganizer/delete/${organizerId}/${contestId}/`);
          
          // Get organizer to get name for removing from organizerNamesByContests
          const allOrganizers = useOrganizerStore.getState().allOrganizers;
          const organizer: any = allOrganizers.find((o: any) => o.id === organizerId);
          const organizerName = organizer 
            ? `${organizer.first_name} ${organizer.last_name}`.trim()
            : null;
          
          set((state) => {
            const currentContests = state.contestsByOrganizers[organizerId] || [];
            const currentOrganizerNames = (state.organizerNamesByContests[contestId] || []) as string[];
            
            const updates: Partial<MapContestOrganizerState> = {
              contestsByOrganizers: {
                ...state.contestsByOrganizers,
                [organizerId]: currentContests.filter((c: Contest) => c.id !== contestId),
              },
            };
            
            // Remove organizer name from contest's organizer names
            if (organizerName && currentOrganizerNames.includes(organizerName)) {
              updates.organizerNamesByContests = {
                ...state.organizerNamesByContests,
                [contestId]: currentOrganizerNames.filter(name => name !== organizerName),
              };
            }
            
            return updates;
          });

          
          dispatchDataChange({ type: 'contest', action: 'update', id: contestId });

          set({ mapContestOrganizerError: null });
        } catch (error) {
          const errorMessage = "Error deleting organizer contest mapping";
          set({ mapContestOrganizerError: errorMessage });
          throw new Error(errorMessage);
        }
      },
      
      addContestToOrganizer: (organizerId: number, contest: Contest) => {
        set((state) => {
          const currentContests = state.contestsByOrganizers[organizerId] || [];
          // Check if contest is already in the list to avoid duplicates
          if (!currentContests.some((c: Contest) => c.id === contest.id)) {
            return {
              contestsByOrganizers: {
                ...state.contestsByOrganizers,
                [organizerId]: [...currentContests, contest],
              },
            };
          }
          return state;
        });
      },
      
      removeContestFromOrganizer: (organizerId: number, contestId: number) => {
        set((state) => {
          const currentContests = state.contestsByOrganizers[organizerId] || [];
          return {
            contestsByOrganizers: {
              ...state.contestsByOrganizers,
              [organizerId]: currentContests.filter((c: Contest) => c.id !== contestId),
            },
          };
        });
      },

      removeOrganizerFromAllContests: (organizerId: number, organizerName: string) => {
        set((state) => {
          const contests = state.contestsByOrganizers[organizerId] || [];
          const updatedOrganizerNames: Record<number, string[]> = {};
          
          // Remove organizer name from all contests they were assigned to
          contests.forEach((contest: Contest) => {
            const currentNames = (state.organizerNamesByContests[contest.id] || []) as string[];
            const filteredNames = currentNames.filter(name => name !== organizerName);
            if (filteredNames.length !== currentNames.length) {
              updatedOrganizerNames[contest.id] = filteredNames;
            }
          });
          
          // Remove organizer from contestsByOrganizers
          const updatedContestsByOrganizers = { ...state.contestsByOrganizers };
          delete updatedContestsByOrganizers[organizerId];
          
          return {
            contestsByOrganizers: updatedContestsByOrganizers,
            organizerNamesByContests: {
              ...state.organizerNamesByContests,
              ...updatedOrganizerNames,
            },
          };
        });
      },

      removeContestFromAllOrganizers: (contestId: number) => {
        set((state) => {
          const updatedContestsByOrganizers: Record<number, Contest[] | null> = {};
          
          // Remove contest from all organizers' assigned contests
          Object.keys(state.contestsByOrganizers).forEach((organizerIdStr) => {
            const organizerId = parseInt(organizerIdStr);
            const contests = state.contestsByOrganizers[organizerId];
            if (contests && Array.isArray(contests)) {
              const filteredContests = contests.filter((c: Contest) => c.id !== contestId);
              if (filteredContests.length !== contests.length) {
                updatedContestsByOrganizers[organizerId] = filteredContests.length > 0 ? filteredContests : null;
              }
            }
          });
          
          // Remove contest from organizerNamesByContests
          const updatedOrganizerNames = { ...state.organizerNamesByContests };
          delete updatedOrganizerNames[contestId];
          
          return {
            contestsByOrganizers: {
              ...state.contestsByOrganizers,
              ...updatedContestsByOrganizers,
            },
            organizerNamesByContests: updatedOrganizerNames,
          };
        });
      },

      updateOrganizerNameInContests: (organizerId: number, oldName: string, newName: string) => {
        set((state) => {
          const updatedOrganizerNames: Record<number, string[]> = {};
          
          // First, try to use contestsByOrganizers to get the specific contests for this organizer
          const contests = state.contestsByOrganizers[organizerId] || [];
          const contestIdsToUpdate = new Set<number>();
          
          // If we have contests from contestsByOrganizers, use those (more accurate)
          if (contests.length > 0) {
            contests.forEach((contest: Contest) => {
              contestIdsToUpdate.add(contest.id);
            });
          } else {
            // Fallback: search all contests for the old name
            // This handles cases where contestsByOrganizers isn't populated
            Object.keys(state.organizerNamesByContests).forEach((contestIdStr) => {
              const contestId = parseInt(contestIdStr);
              const currentNames = (state.organizerNamesByContests[contestId] || []) as string[];
              if (currentNames.includes(oldName)) {
                contestIdsToUpdate.add(contestId);
              }
            });
          }
          
          // Update organizer name in all relevant contests
          contestIdsToUpdate.forEach((contestId) => {
            const currentNames = (state.organizerNamesByContests[contestId] || []) as string[];
            if (currentNames.includes(oldName)) {
              const updatedNames = currentNames.map(name => name === oldName ? newName : name);
              updatedOrganizerNames[contestId] = updatedNames;
            }
          });
          
          // Only update if there are changes
          if (Object.keys(updatedOrganizerNames).length > 0) {
            return {
              organizerNamesByContests: {
                ...state.organizerNamesByContests,
                ...updatedOrganizerNames,
              },
            };
          }
          
          return state;
        });
      },

      updateContestInMappings: (contestId: number, updatedContest: Contest) => {
        set((state) => {
          const updatedContestsByOrganizers: Record<number, Contest[] | null> = {};
          let hasChanges = false;
          
          // Update contest in all organizers' assigned contests
          Object.keys(state.contestsByOrganizers).forEach((organizerIdStr) => {
            const organizerId = parseInt(organizerIdStr);
            const contests = state.contestsByOrganizers[organizerId];
            if (contests && Array.isArray(contests)) {
              const contestIndex = contests.findIndex((c: Contest) => c.id === contestId);
              if (contestIndex !== -1) {
                const updatedContests = [...contests];
                updatedContests[contestIndex] = updatedContest;
                updatedContestsByOrganizers[organizerId] = updatedContests;
                hasChanges = true;
              }
            }
          });
          
          // Also update the contests array if it contains this contest
          const contestIndex = state.contests.findIndex((c: Contest) => c.id === contestId);
          const updatedContests = contestIndex !== -1 
            ? state.contests.map((c: Contest) => c.id === contestId ? updatedContest : c)
            : state.contests;
          
          // Always return a new state object to ensure Zustand detects the change
          // This ensures components subscribed to these fields will re-render
          return {
            ...state,
            contestsByOrganizers: hasChanges 
              ? {
                  ...state.contestsByOrganizers,
                  ...updatedContestsByOrganizers,
                }
              : state.contestsByOrganizers,
            contests: contestIndex !== -1 ? updatedContests : state.contests,
          };
        });
      },

      fetchContestsByOrganizerId: async (organizerId: number, forceRefresh = false) => {
        // If we already have contests and not forcing refresh, show them immediately and refresh in background
        const currentContests = get().contests;
        if (!forceRefresh && currentContests && currentContests.length > 0) {
          // Refresh in background without blocking
          api.get(
            `/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`,
            {
              withCredentials: true,
            }
          )
            .then((response) => {
              set({
                contests: response.data.Contests,
                mapContestOrganizerError: null,
              });
            })
            .catch((error: any) => {
              const errorMessage = error?.response?.data?.detail || error?.message || "Error fetching contests";
              console.error(`Failed to refresh contests for organizer ${organizerId}:`, errorMessage);
              // Don't set error on background refresh failure, just log it
            });
          return; // Return early with cached data
        }

        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });

        try {
          const response = await api.get(
            `/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`,
            {
              withCredentials: true, // Ensure credentials are sent
            }
          );
          set({
            contests: response.data.Contests,
          });
          set({ mapContestOrganizerError: null });
        } catch (error: any) {
          // Extract detailed error message from backend
          const errorMessage = error?.response?.data?.detail || error?.message || "Error fetching contests";
          set({ mapContestOrganizerError: errorMessage });
          console.error(`Failed to fetch contests for organizer ${organizerId}:`, errorMessage);
          
          // If authentication error, log more details
          if (error?.response?.status === 401 || errorMessage.includes("Authentication credentials")) {
            console.error("Session may have expired. Please log in again.");
          }
          
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
          const response = await api.get(
            `/api/mapping/organizerToContest/getOrganizersByContest/${contestId}/`
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
        // Check cache first - if we already have contests by organizers, return early
        const cachedContestsByOrganizers = get().contestsByOrganizers;
        if (cachedContestsByOrganizers && Object.keys(cachedContestsByOrganizers).length > 0) {
          return; // Use cached data
        }
        
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });
        try {
          const response = await api.get(
            `/api/mapping/contestToOrganizer/getAllContestsPerOrganizer/`
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
        // Check cache first - if we already have organizer names, return early
        const cachedOrganizerNames = get().organizerNamesByContests;
        if (cachedOrganizerNames && Object.keys(cachedOrganizerNames).length > 0) {
          return; // Use cached data
        }
        
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });
        try {
          const response = await api.get(
            `/api/mapping/contestToOrganizer/getOrganizerNames/`
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
