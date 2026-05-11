export type PetType = 'bird' | 'bunny' | 'puppy' | 'fish' | 'dragon';
export type HatchState = 'egg' | 'ready' | 'hatched';

export interface Student {
  id: string;
  name: string;
  nickname: string;
  eggColor: string;
  exp: number;
  level: number;
  effects: string[];
  petType: PetType;
  hatchState: HatchState;
  mood: number;
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

export interface TeacherAccount {
  accountKey: string;
  className: string;
  teacherName: string;
  password: string;
  profileColor: string;
  createdAt: number;
  updatedAt: number;
}

export interface RememberedTeacherAccount {
  accountKey: string;
  className: string;
  teacherName: string;
}

export interface RegisterTeacherAccountInput {
  className: string;
  teacherName: string;
  password: string;
  profileColor?: string;
}

export interface AddBehaviorRuleInput {
  name: string;
  points: number;
  type: 'positive' | 'negative';
}

const STORAGE_KEYS = {
  TEACHERS: 'class_pet_teachers',
  LAST_TEACHER: 'class_pet_last_teacher',
  STUDENTS: 'class_pet_students',
  SETTINGS: 'class_pet_settings',
  LOGS: 'class_pet_logs',
  LEGACY_AUTH_USER: 'class_pet_auth_user',
} as const;

const STORAGE_UPDATE_EVENT = 'local-storage-update';
const DEFAULT_PROFILE_COLOR = 'purple';
const PET_TYPES: PetType[] = ['bird', 'bunny', 'puppy', 'fish', 'dragon'];

type StorageUpdateDetail = {
  key: string | null;
};

export const normalizeAccountPart = (value: string) => value.trim().replace(/\s+/g, ' ');

export const buildTeacherAccountKey = (className: string, teacherName: string) =>
  `${normalizeAccountPart(className)}::${normalizeAccountPart(teacherName)}`;

const getTeacherStudentsStorageKey = (accountKey: string) => `${STORAGE_KEYS.STUDENTS}:${accountKey}`;
const getTeacherSettingsStorageKey = (accountKey: string) => `${STORAGE_KEYS.SETTINGS}:${accountKey}`;
const getTeacherLogsStorageKey = (accountKey: string) => `${STORAGE_KEYS.LOGS}:${accountKey}`;

const notifyChange = (key: string | null) => {
  window.dispatchEvent(
    new CustomEvent<StorageUpdateDetail>(STORAGE_UPDATE_EVENT, {
      detail: { key },
    }),
  );
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
    notifyChange(key);
  } catch (error) {
    console.error('Error saving to localStorage', error);
    throw error;
  }
};

const removeFromStorage = (key: string) => {
  localStorage.removeItem(key);
  notifyChange(key);
};

const shouldHandleStorageChange = (eventKey: string | null, targetKey: string) =>
  eventKey === null || eventKey === targetKey;

const getStablePetType = (seed: string): PetType => {
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PET_TYPES[total % PET_TYPES.length];
};

const normalizeHatchState = (student: Omit<Student, 'petType' | 'hatchState' | 'mood'> & Partial<Pick<Student, 'petType' | 'hatchState' | 'mood'>>): HatchState => {
  if (student.hatchState) {
    return student.hatchState;
  }
  return student.level >= 2 ? 'hatched' : 'egg';
};

const normalizeMood = (student: Omit<Student, 'petType' | 'hatchState' | 'mood'> & Partial<Pick<Student, 'petType' | 'hatchState' | 'mood'>>) => {
  if (typeof student.mood === 'number' && Number.isFinite(student.mood)) {
    return Math.max(10, Math.min(100, Math.round(student.mood)));
  }
  return 100;
};

const normalizeStudent = (
  student: Omit<Student, 'petType' | 'hatchState' | 'mood'> & Partial<Pick<Student, 'petType' | 'hatchState' | 'mood'>>,
): Student => ({
  ...student,
  petType: student.petType ?? getStablePetType(student.id),
  hatchState: normalizeHatchState(student),
  mood: normalizeMood(student),
});

const normalizeStudents = (
  students: Array<Omit<Student, 'petType' | 'hatchState' | 'mood'> & Partial<Pick<Student, 'petType' | 'hatchState' | 'mood'>>>,
) => students.map(normalizeStudent);

const createStudentRecord = (
  studentData: Omit<Student, 'createdAt' | 'lastInteractionTime' | 'mood'>,
  now = Date.now(),
): Student => normalizeStudent({
  ...studentData,
  lastInteractionTime: now,
  createdAt: now,
});

const subscribeToStorageKey = <T>(
  storageKey: string,
  loadValue: () => T,
  callback: (value: T) => void,
) => {
  const emit = () => {
    callback(loadValue());
  };

  const handleLocalUpdate = (event: Event) => {
    const changedKey = (event as CustomEvent<StorageUpdateDetail>).detail?.key ?? null;
    if (!shouldHandleStorageChange(changedKey, storageKey)) {
      return;
    }
    emit();
  };

  const handleStorage = (event: StorageEvent) => {
    if (!shouldHandleStorageChange(event.key, storageKey)) {
      return;
    }
    emit();
  };

  emit();

  window.addEventListener(STORAGE_UPDATE_EVENT, handleLocalUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(STORAGE_UPDATE_EVENT, handleLocalUpdate);
    window.removeEventListener('storage', handleStorage);
  };
};

const createDefaultRules = (): BehaviorRule[] => [
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
  { id: '13', name: '乱扔垃圾', points: -3, type: 'negative' },
];

const createDefaultSettings = (): Settings => ({
  rules: createDefaultRules(),
  updatedAt: Date.now(),
});

const createSettingsWithDefaults = (settings?: Settings | null): Settings => ({
  ...createDefaultSettings(),
  ...settings,
  rules: settings?.rules?.length ? settings.rules : createDefaultRules(),
});

export class TeacherAccountExistsError extends Error {
  readonly accountKey: string;

  constructor(accountKey: string) {
    super(`Teacher account already exists for ${accountKey}`);
    this.name = 'TeacherAccountExistsError';
    this.accountKey = accountKey;
  }
}

export const getTeacherRegistry = () =>
  getFromStorage<Record<string, TeacherAccount>>(STORAGE_KEYS.TEACHERS, {});

export const getTeacherAccount = (accountKey: string) => getTeacherRegistry()[accountKey] ?? null;

export const findTeacherAccount = (className: string, teacherName: string) =>
  getTeacherAccount(buildTeacherAccountKey(className, teacherName));

export const validateTeacherCredentials = (accountKey: string, password: string) => {
  const account = getTeacherAccount(accountKey);
  return Boolean(account && account.password === password);
};

export const hasTeacherAccount = (className: string, teacherName: string) =>
  Boolean(findTeacherAccount(className, teacherName));

export const assertTeacherAccountAvailable = (className: string, teacherName: string) => {
  const accountKey = buildTeacherAccountKey(className, teacherName);
  if (getTeacherAccount(accountKey)) {
    throw new TeacherAccountExistsError(accountKey);
  }
  return accountKey;
};

export const registerTeacherAccount = async ({
  className,
  teacherName,
  password,
  profileColor = DEFAULT_PROFILE_COLOR,
}: RegisterTeacherAccountInput): Promise<TeacherAccount> => {
  const accountKey = assertTeacherAccountAvailable(className, teacherName);
  const teachers = getTeacherRegistry();
  const now = Date.now();
  const teacherAccount: TeacherAccount = {
    accountKey,
    className,
    teacherName,
    password,
    profileColor,
    createdAt: now,
    updatedAt: now,
  };

  setToStorage(STORAGE_KEYS.TEACHERS, {
    ...teachers,
    [accountKey]: teacherAccount,
  });

  return teacherAccount;
};

export const rememberTeacherAccount = (
  teacher: Pick<TeacherAccount, 'accountKey' | 'className' | 'teacherName'>,
) => {
  setToStorage<RememberedTeacherAccount>(STORAGE_KEYS.LAST_TEACHER, {
    accountKey: teacher.accountKey,
    className: teacher.className,
    teacherName: teacher.teacherName,
  });
};

export const getRememberedTeacherAccount = () =>
  getFromStorage<RememberedTeacherAccount | null>(STORAGE_KEYS.LAST_TEACHER, null);

export const clearRememberedTeacherAccount = () => {
  removeFromStorage(STORAGE_KEYS.LAST_TEACHER);
};

export const getSharedStudents = () =>
  normalizeStudents(getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, []));

export const getSharedSettings = () => getFromStorage<Settings | null>(STORAGE_KEYS.SETTINGS, null);

export const getSharedBehaviorLogs = (studentId?: string) => {
  const logs = getFromStorage<BehaviorLog[]>(STORAGE_KEYS.LOGS, []);
  return studentId ? logs.filter((log) => log.studentId === studentId) : logs;
};

export const subscribeToSharedStudents = (callback: (students: Student[]) => void) =>
  subscribeToStorageKey(STORAGE_KEYS.STUDENTS, getSharedStudents, callback);

export const subscribeToSharedSettings = (callback: (settings: Settings | null) => void) =>
  subscribeToStorageKey(STORAGE_KEYS.SETTINGS, getSharedSettings, callback);

export const createSharedStudent = async (
  studentData: Omit<Student, 'createdAt' | 'lastInteractionTime' | 'mood'>,
) => {
  const students = getSharedStudents();
  const newStudent = createStudentRecord(studentData);
  setToStorage(STORAGE_KEYS.STUDENTS, [...students, newStudent]);
};

export const updateSharedStudentPoints = async (
  studentId: string,
  expOffset: number,
  newLevel: number,
  newEffects: string[],
  authUid: string,
  actionName: string,
) => {
  const students = getSharedStudents();
  const logs = getSharedBehaviorLogs();
  const studentIndex = students.findIndex((student) => student.id === studentId);
  if (studentIndex === -1) return;

  const now = Date.now();
  const newLog: BehaviorLog = {
    id: `log_${now}_${Math.random()}`,
    studentId,
    actionName,
    points: expOffset,
    timestamp: now,
    teacherId: authUid,
  };

  setToStorage(STORAGE_KEYS.LOGS, [...logs, newLog]);

  const currentStudent = students[studentIndex];
  const newExp = Math.max(0, currentStudent.exp + expOffset);
  const nextHatchState = currentStudent.hatchState === 'hatched'
    ? 'hatched'
    : newLevel >= 2
      ? 'ready'
      : 'egg';

  students[studentIndex] = {
    ...currentStudent,
    exp: newExp,
    level: newLevel,
    effects: newEffects,
    hatchState: nextHatchState,
  };

  setToStorage(STORAGE_KEYS.STUDENTS, students);
};

const getInteractionMoodBoost = () => Math.floor(Math.random() * 5) + 1;

const applyStudentInteraction = (student: Student, now = Date.now()): Student => {
  const hoursSince = (now - student.lastInteractionTime) / (1000 * 60 * 60);
  const currentMood = Math.max(10, Math.min(100, student.mood - hoursSince * 5));
  const nextMood = Math.min(100, Math.round(currentMood + getInteractionMoodBoost()));

  return {
    ...student,
    mood: nextMood,
    lastInteractionTime: now,
  };
};

export const updateSharedStudentInteraction = async (studentId: string) => {
  const students = getSharedStudents();
  const studentIndex = students.findIndex((student) => student.id === studentId);
  if (studentIndex === -1) return;

  students[studentIndex] = applyStudentInteraction(students[studentIndex]);
  setToStorage(STORAGE_KEYS.STUDENTS, students);
};

export const updateStudentInteraction = updateSharedStudentInteraction;

export const hatchSharedStudentPet = async (studentId: string) => {
  const students = getSharedStudents();
  const studentIndex = students.findIndex((student) => student.id === studentId);
  if (studentIndex === -1) return;

  students[studentIndex] = {
    ...students[studentIndex],
    hatchState: 'hatched',
    lastInteractionTime: Date.now(),
  };
  setToStorage(STORAGE_KEYS.STUDENTS, students);
};

export const deleteSharedStudents = async (studentIds: string[]) => {
  const studentIdSet = new Set(studentIds);
  const students = getSharedStudents().filter((student) => !studentIdSet.has(student.id));
  const logs = getSharedBehaviorLogs().filter((log) => !studentIdSet.has(log.studentId));
  setToStorage(STORAGE_KEYS.STUDENTS, students);
  setToStorage(STORAGE_KEYS.LOGS, logs);
};

export const updateSharedClassPin = async (pin: string) => {
  const settings = createSettingsWithDefaults(getSharedSettings());
  settings.classPin = pin;
  settings.updatedAt = Date.now();
  setToStorage(STORAGE_KEYS.SETTINGS, settings);
};

export const initSharedSettings = async () => {
  const settings = getSharedSettings();
  if (!settings) {
    setToStorage<Settings>(STORAGE_KEYS.SETTINGS, createDefaultSettings());
  }
};

export const getTeacherStudents = (accountKey: string) =>
  normalizeStudents(getFromStorage<Student[]>(getTeacherStudentsStorageKey(accountKey), []));

export const getTeacherSettings = (accountKey: string) =>
  getFromStorage<Settings | null>(getTeacherSettingsStorageKey(accountKey), null);

export const getTeacherBehaviorLogs = (accountKey: string, studentId?: string) => {
  const logs = getFromStorage<BehaviorLog[]>(getTeacherLogsStorageKey(accountKey), []);
  return studentId ? logs.filter((log) => log.studentId === studentId) : logs;
};

export const subscribeToTeacherStudents = (
  accountKey: string,
  callback: (students: Student[]) => void,
) => subscribeToStorageKey(getTeacherStudentsStorageKey(accountKey), () => getTeacherStudents(accountKey), callback);

export const subscribeToTeacherSettings = (
  accountKey: string,
  callback: (settings: Settings | null) => void,
) => subscribeToStorageKey(getTeacherSettingsStorageKey(accountKey), () => getTeacherSettings(accountKey), callback);

export const createTeacherStudent = async (
  accountKey: string,
  studentData: Omit<Student, 'createdAt' | 'lastInteractionTime' | 'mood'>,
) => {
  const students = getTeacherStudents(accountKey);
  const newStudent = createStudentRecord(studentData);
  setToStorage(getTeacherStudentsStorageKey(accountKey), [...students, newStudent]);
};

export const updateTeacherStudentPoints = async (
  accountKey: string,
  studentId: string,
  expOffset: number,
  newLevel: number,
  newEffects: string[],
  authUid: string,
  actionName: string,
) => {
  const students = getTeacherStudents(accountKey);
  const logs = getTeacherBehaviorLogs(accountKey);
  const studentIndex = students.findIndex((student) => student.id === studentId);
  if (studentIndex === -1) return;

  const now = Date.now();
  const newLog: BehaviorLog = {
    id: `log_${now}_${Math.random()}`,
    studentId,
    actionName,
    points: expOffset,
    timestamp: now,
    teacherId: authUid,
  };

  setToStorage(getTeacherLogsStorageKey(accountKey), [...logs, newLog]);

  const currentStudent = students[studentIndex];
  const newExp = Math.max(0, currentStudent.exp + expOffset);
  const nextHatchState = currentStudent.hatchState === 'hatched'
    ? 'hatched'
    : newLevel >= 2
      ? 'ready'
      : 'egg';

  students[studentIndex] = {
    ...currentStudent,
    exp: newExp,
    level: newLevel,
    effects: newEffects,
    hatchState: nextHatchState,
  };

  setToStorage(getTeacherStudentsStorageKey(accountKey), students);
};

export const updateTeacherStudentInteraction = async (accountKey: string, studentId: string) => {
  const students = getTeacherStudents(accountKey);
  const studentIndex = students.findIndex((student) => student.id === studentId);
  if (studentIndex === -1) return;

  students[studentIndex] = applyStudentInteraction(students[studentIndex]);
  setToStorage(getTeacherStudentsStorageKey(accountKey), students);
};

export const hatchTeacherStudentPet = async (accountKey: string, studentId: string) => {
  const students = getTeacherStudents(accountKey);
  const studentIndex = students.findIndex((student) => student.id === studentId);
  if (studentIndex === -1) return;

  students[studentIndex] = {
    ...students[studentIndex],
    hatchState: 'hatched',
    lastInteractionTime: Date.now(),
  };
  setToStorage(getTeacherStudentsStorageKey(accountKey), students);
};

export const deleteTeacherStudents = async (accountKey: string, studentIds: string[]) => {
  const studentIdSet = new Set(studentIds);
  const students = getTeacherStudents(accountKey).filter((student) => !studentIdSet.has(student.id));
  const logs = getTeacherBehaviorLogs(accountKey).filter((log) => !studentIdSet.has(log.studentId));
  setToStorage(getTeacherStudentsStorageKey(accountKey), students);
  setToStorage(getTeacherLogsStorageKey(accountKey), logs);
};

export const addTeacherBehaviorRule = async (accountKey: string, input: AddBehaviorRuleInput) => {
  const settings = createSettingsWithDefaults(getTeacherSettings(accountKey));
  const nextRule: BehaviorRule = {
    id: `rule_${Date.now()}_${Math.random()}`,
    name: input.name.trim(),
    points: input.type === 'negative' ? -Math.abs(input.points) : Math.abs(input.points),
    type: input.type,
  };

  settings.rules = [...settings.rules, nextRule];
  settings.updatedAt = Date.now();
  setToStorage(getTeacherSettingsStorageKey(accountKey), settings);
};

export const updateTeacherClassPin = async (accountKey: string, pin: string) => {
  const settings = createSettingsWithDefaults(getTeacherSettings(accountKey));
  settings.classPin = pin;
  settings.updatedAt = Date.now();
  setToStorage(getTeacherSettingsStorageKey(accountKey), settings);
};

export const updateTeacherPassword = async (accountKey: string, password: string) => {
  const teachers = getTeacherRegistry();
  const teacher = teachers[accountKey];
  if (!teacher) {
    return;
  }

  setToStorage(STORAGE_KEYS.TEACHERS, {
    ...teachers,
    [accountKey]: {
      ...teacher,
      password,
      updatedAt: Date.now(),
    },
  });
};

export const updateTeacherProfileColor = async (accountKey: string, profileColor: string) => {
  const teachers = getTeacherRegistry();
  const teacher = teachers[accountKey];
  if (!teacher) {
    return;
  }

  setToStorage(STORAGE_KEYS.TEACHERS, {
    ...teachers,
    [accountKey]: {
      ...teacher,
      profileColor,
      updatedAt: Date.now(),
    },
  });
};

export const initTeacherSettings = async (accountKey: string) => {
  const settings = getTeacherSettings(accountKey);
  if (!settings) {
    setToStorage<Settings>(getTeacherSettingsStorageKey(accountKey), createDefaultSettings());
  }
};

export const clearLegacyTeacherAuthUser = () => {
  removeFromStorage(STORAGE_KEYS.LEGACY_AUTH_USER);
};
