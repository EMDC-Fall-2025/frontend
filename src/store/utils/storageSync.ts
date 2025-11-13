/**
 * Global storage event listener for syncing Zustand stores across tabs
 * This listens for localStorage changes and updates the corresponding stores
 */

// Map of storage keys to their corresponding store setState functions
const storeSyncMap: Map<string, (state: any) => void> = new Map();

/**
 * Register a store for cross-tab synchronization
 * @param storageKey The localStorage key used by Zustand persist
 * @param setState Function to update the store state
 */
export function registerStoreSync(storageKey: string, setState: (state: any) => void) {
  storeSyncMap.set(storageKey, setState);
}

/**
 * Initialize the global storage event listener
 * This should be called once when the app starts
 */
export function initStorageSync() {
  if (typeof window === 'undefined') return;

  // Only add listener once
  if ((window as any).__storageSyncInitialized) return;
  (window as any).__storageSyncInitialized = true;

  window.addEventListener('storage', (e) => {
    if (!e.key || !e.newValue) return;

    const syncFunction = storeSyncMap.get(e.key);
    if (syncFunction) {
      try {
        const newState = JSON.parse(e.newValue);
        // Zustand persist stores data as { state: {...}, version: ... }
        if (newState.state) {
          syncFunction(newState.state);
        }
      } catch (error) {
        // Ignore parse errors
        console.warn(`Failed to sync store for key ${e.key}:`, error);
      }
    }
  });
}

