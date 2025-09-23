import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export interface FeedbackDisplaySettings {
  id?: number;
  contestid: number;
  show_presentation_comments: boolean;
  show_journal_comments: boolean;
  show_machinedesign_comments: boolean;
  show_redesign_comments: boolean;
  show_championship_comments: boolean;
  show_penalty_comments: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FeedbackControlState {
  settings: FeedbackDisplaySettings[];
  currentSettings: FeedbackDisplaySettings | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getAllSettings: () => Promise<void>;
  getSettingsForContest: (contestId: number) => Promise<void>;
  createSettings: (settings: Omit<FeedbackDisplaySettings, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSettings: (settings: FeedbackDisplaySettings) => Promise<void>;
  deleteSettings: (contestId: number) => Promise<void>;
  clearError: () => void;
  clearSettings: () => void;
}

const useFeedbackControlStore = create<FeedbackControlState>()(
  persist(
    (set, get) => ({
      settings: [],
      currentSettings: null,
      isLoading: false,
      error: null,

      getAllSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/feedback/settings/all/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          const payload = response.data;
          const settings = Array.isArray(payload)
            ? payload
            : Array.isArray((payload as any)?.settings)
              ? (payload as any).settings
              : payload; // fallback if API returns plain array
          set({ settings: settings as any, isLoading: false });
        } catch (error: any) {
          const message = error?.response?.status
            ? `Error fetching feedback settings (HTTP ${error.response.status})`
            : "Error fetching feedback settings";
          set({ error: message, isLoading: false });
        }
      },

      getSettingsForContest: async (contestId: number) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`/api/feedback/settings/${contestId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          set({ currentSettings: response.data, isLoading: false });
        } catch (error: any) {
          set({ error: "Error fetching feedback settings for contest", isLoading: false });
        }
      },

      createSettings: async (settings) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(`/api/feedback/settings/create/`, settings, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          // Update local state
          const newSettings = response.data;
          set((state) => ({
            settings: [...state.settings, newSettings],
            currentSettings: newSettings,
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: "Error creating feedback settings", isLoading: false });
        }
      },

      updateSettings: async (settings) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await axios.put(`/api/feedback/settings/update/`, settings, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          // Update local state
          const updatedSettings = response.data;
          set((state) => ({
            settings: state.settings.map(s => s.contestid === updatedSettings.contestid ? updatedSettings : s),
            currentSettings: updatedSettings,
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: "Error updating feedback settings", isLoading: false });
        }
      },

      deleteSettings: async (contestId: number) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/feedback/settings/delete/${contestId}/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          // Update local state
          set((state) => ({
            settings: state.settings.filter(s => s.contestid !== contestId),
            currentSettings: state.currentSettings?.contestid === contestId ? null : state.currentSettings,
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: "Error deleting feedback settings", isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
      clearSettings: () => set({ settings: [], currentSettings: null }),
    }),
    {
      name: "feedback-control-storage",
      partialize: (state) => ({ 
        settings: state.settings,
        currentSettings: state.currentSettings 
      }),
    }
  )
);

export default useFeedbackControlStore;
