/**
 * Global event system for notifying components when data changes
 * This allows immediate refresh across all pages without waiting for polling intervals
 */

export type DataChangeType = 
  | 'team' 
  | 'judge' 
  | 'organizer' 
  | 'coach' 
  | 'cluster' 
  | 'contest'
  | 'scoresheet'
  | 'championship';

export type DataChangeAction = 'create' | 'update' | 'delete';

export interface DataChangeEvent {
  type: DataChangeType;
  action: DataChangeAction;
  id?: number;
  contestId?: number;
  clusterId?: number;
  teamId?: number;
  judgeId?: number;
}

/**
 * Dispatch a data change event to notify all listening components
 */
export const dispatchDataChange = (event: DataChangeEvent) => {
  window.dispatchEvent(new CustomEvent('dataChange', { detail: event }));
};

/**
 * Listen for data change events
 */
export const onDataChange = (callback: (event: DataChangeEvent) => void) => {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<DataChangeEvent>;
    callback(customEvent.detail);
  };
  window.addEventListener('dataChange', handler);
  return () => window.removeEventListener('dataChange', handler);
};

