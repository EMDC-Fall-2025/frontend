import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Contest, Organizer } from "../../types";
import useContestStore from "../primary_stores/contestStore";
import useOrganizerStore from "../primary_stores/organizerStore";

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
        // Don't set loading state - we're doing direct store updates
        set({
          mapContestOrganizerError: null,
        });

        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/mapping/contestToOrganizer/create/`,
            { contestid: contestId, organizerid: organizerId },
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
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
              const organizerToken = localStorage.getItem("token");
              const organizerResponse = await axios.get(
                `/api/organizer/get/${organizerId}/`,
                {
                  headers: {
                    Authorization: `Token ${organizerToken}`,
                  },
                }
              );
              const fetchedOrganizer = organizerResponse.data.organizer || organizerResponse.data;
              if (fetchedOrganizer) {
                organizerName = `${fetchedOrganizer.first_name} ${fetchedOrganizer.last_name}`.trim();
              }
            } catch (err) {
              console.warn("Could not fetch organizer details");
            }
          }
          
          if (contest) {
            // Directly update the store - no fetch needed!
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
        // Don't set loading state - we're doing direct store updates
        set({
          mapContestOrganizerError: null,
        });

        try {
          const token = localStorage.getItem("token");
          await axios.delete(
            `/api/mapping/contestToOrganizer/delete/${organizerId}/${contestId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          
          // Get organizer to get name for removing from organizerNamesByContests
          const allOrganizers = useOrganizerStore.getState().allOrganizers;
          const organizer: any = allOrganizers.find((o: any) => o.id === organizerId);
          const organizerName = organizer 
            ? `${organizer.first_name} ${organizer.last_name}`.trim()
            : null;
          
          // Directly update the store - no fetch needed!
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

      fetchContestsByOrganizerId: async (organizerId: number) => {
        set({
          isLoadingMapContestOrganizer: true,
          mapContestOrganizerError: null,
        });

        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`,
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
            `/api/mapping/organizerToContest/getOrganizersByContest/${contestId}/`,
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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/contestToOrganizer/getAllContestsPerOrganizer/`,
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
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/mapping/contestToOrganizer/getOrganizerNames/`,
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
