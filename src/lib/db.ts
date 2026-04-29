export interface Student {
  id: string;
  name: string;
  nickname: string;
  eggColor: string;
  exp: number;
  level: number;
  effects: string[];
  lastInteractionTime: number;
  createdAt: number;
}

export interface BehaviorRule {
  id: string;
  name: string;
  points: number;
  type: 'positive' | 'negative';
}

export interface BehaviorLog {
  id: string;
  studentId: string;
  actionName: string;
  points: number;
  timestamp: number;
  teacherId: string;
}

export interface Settings {
  rules: BehaviorRule[];
  updatedAt: number;
  classPin?: string;
}

const STORAGE_KEYS = {
  STUDENTS: 'class_pet_students',
  SETTINGS: 'class_pet_settings',
  LOGS: 'class_pet_logs',
};

const notifyChange = () => {
  window.dispatchEvent(new Event('local-storage-update'));
};

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return defaultValue;
  }
};

const setToStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyChange();
  } catch (error) {
    console.error('Error saving to localStorage', error);
  }
};

export const subscribeToStudents = (callback: (students: Student[]) => void) => {
  const handler = () => {
    callback(getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, []));
  };
  
  // Initial call
  handler();
  
  window.addEventListener('local-storage-update', handler);
  window.addEventListener('storage', handler); // For cross-tab sync
  
  return () => {
    window.removeEventListener('local-storage-update', handler);
    window.removeEventListener('storage', handler);
  };
};

export const subscribeToSettings = (callback: (settings: Settings | null) => void) => {
  const handler = () => {
    callback(getFromStorage<Settings | null>(STORAGE_KEYS.SETTINGS, null));
  };
  
  // Initial call
  handler();
  
  window.addEventListener('local-storage-update', handler);
  window.addEventListener('storage', handler);
  
  return () => {
    window.removeEventListener('local-storage-update', handler);
    window.removeEventListener('storage', handler);
  };
};

export const createStudent = async (studentData: Omit<Student, 'createdAt' | 'lastInteractionTime'>) => {
  const students = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const now = Date.now();
  const newStudent: Student = {
    ...studentData,
    lastInteractionTime: now,
    createdAt: now
  };
  setToStorage(STORAGE_KEYS.STUDENTS, [...students, newStudent]);
};

export const updateStudentPoints = async (studentId: string, expOffset: number, newLevel: number, newEffects: string[], authUid: string, actionName: string) => {
  const students = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const logs = getFromStorage<BehaviorLog[]>(STORAGE_KEYS.LOGS, []);
  
  const studentIndex = students.findIndex(s => s.id === studentId);
  if (studentIndex === -1) return;
  
  const now = Date.now();
  const newLog: BehaviorLog = {
    id: `log_${now}_${Math.random()}`,
    studentId,
    actionName,
    points: expOffset,
    timestamp: now,
    teacherId: authUid
  };
  
  setToStorage(STORAGE_KEYS.LOGS, [...logs, newLog]);
  
  const newExp = Math.max(0, students[studentIndex].exp + expOffset);
  students[studentIndex] = {
    ...students[studentIndex],
    exp: newExp,
    level: newLevel,
    effects: newEffects
  };
  
  setToStorage(STORAGE_KEYS.STUDENTS, students);
};

export const updateStudentInteraction = async (studentId: string) => {
  const students = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const studentIndex = students.findIndex(s => s.id === studentId);
  if (studentIndex === -1) return;
  
  students[studentIndex].lastInteractionTime = Date.now();
  setToStorage(STORAGE_KEYS.STUDENTS, students);
};

export const updateClassPin = async (pin: string) => {
  const settings = getFromStorage<Settings>(STORAGE_KEYS.SETTINGS, { rules: [], updatedAt: Date.now() });
  settings.classPin = pin;
  settings.updatedAt = Date.now();
  setToStorage(STORAGE_KEYS.SETTINGS, settings);
};

export const initSettings = async () => {
  const settings = getFromStorage<Settings | null>(STORAGE_KEYS.SETTINGS, null);
  if (!settings) {
    setToStorage<Settings>(STORAGE_KEYS.SETTINGS, {
      rules: [
        { id: '1', name: '帮助打扫卫生', points: 5, type: 'positive' },
        { id: '2', name: '帮忙擦黑板', points: 3, type: 'positive' },
        { id: '3', name: '作业优秀', points: 5, type: 'positive' },
        { id: '4', name: '主动回答问题', points: 3, type: 'positive' },
        { id: '5', name: '好人好事', points: 5, type: 'positive' },
        { id: '6', name: '乐于助人', points: 4, type: 'positive' },
        { id: '7', name: '听课认真', points: 3, type: 'positive' },
        { id: '8', name: '思维活跃', points: 4, type: 'positive' },
        { id: '9', name: '迟到/早退', points: -3, type: 'negative' },
        { id: '10', name: '课上讲话', points: -5, type: 'negative' },
        { id: '11', name: '逃避值日', points: -5, type: 'negative' },
        { id: '12', name: '未交作业', points: -5, type: 'negative' },
        { id: '13', name: '乱扔垃圾', points: -3, type: 'negative' }
      ],
      updatedAt: Date.now()
    });
  }
};
