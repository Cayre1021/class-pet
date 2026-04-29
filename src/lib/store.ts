import { create } from 'zustand';
import { Student, subscribeToStudents, Settings, subscribeToSettings } from './db';

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
  setStudents: (students) => set({ students, loading: false }),
  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ loading })
}));

export const initSync = () => {
  const unsubStudents = subscribeToStudents((students) => {
    useAppStore.getState().setStudents(students);
  });
  const unsubSettings = subscribeToSettings((settings) => {
    useAppStore.getState().setSettings(settings);
  });
  return () => {
    unsubStudents();
    unsubSettings();
  };
};
