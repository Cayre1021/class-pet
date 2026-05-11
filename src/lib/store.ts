import { create } from 'zustand';
import {
  Student,
  subscribeToSharedSettings,
  subscribeToSharedStudents,
  subscribeToTeacherSettings,
  subscribeToTeacherStudents,
  Settings,
} from './db';

interface AppState {
  students: Student[];
  settings: Settings | null;
  loading: boolean;
  setStudents: (students: Student[]) => void;
  setSettings: (settings: Settings | null) => void;
  setLoading: (l: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  students: [],
  settings: null,
  loading: true,
  setStudents: (students) => set({ students }),
  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ loading }),
}));

let activeSyncToken = 0;

export const initSync = (accountKey?: string | null) => {
  activeSyncToken += 1;
  const syncToken = activeSyncToken;
  let studentsHydrated = false;
  let settingsHydrated = false;

  const applyHydrationState = () => {
    if (syncToken !== activeSyncToken) {
      return;
    }

    useAppStore.getState().setLoading(!(studentsHydrated && settingsHydrated));
  };

  useAppStore.getState().setLoading(true);

  const studentSubscriber = accountKey
    ? (callback: (students: Student[]) => void) => subscribeToTeacherStudents(accountKey, callback)
    : subscribeToSharedStudents;
  const settingsSubscriber = accountKey
    ? (callback: (settings: Settings | null) => void) => subscribeToTeacherSettings(accountKey, callback)
    : subscribeToSharedSettings;

  const unsubStudents = studentSubscriber((students) => {
    if (syncToken !== activeSyncToken) {
      return;
    }

    studentsHydrated = true;
    useAppStore.getState().setStudents(students);
    applyHydrationState();
  });

  const unsubSettings = settingsSubscriber((settings) => {
    if (syncToken !== activeSyncToken) {
      return;
    }

    settingsHydrated = true;
    useAppStore.getState().setSettings(settings);
    applyHydrationState();
  });

  return () => {
    if (syncToken === activeSyncToken) {
      activeSyncToken += 1;
    }
    unsubStudents();
    unsubSettings();
  };
};

export const initSharedSync = () => initSync();

export const initTeacherSync = (accountKey: string) => initSync(accountKey);
