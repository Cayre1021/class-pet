import { describe, expect, it } from 'vitest';
import type { Student } from './db';
import { getStudentPetVisual } from './pets';

const createStudent = (overrides: Partial<Student> = {}): Student => ({
  id: 'student_1',
  name: '测试学生',
  nickname: '测试宠物',
  eggColor: 'blue',
  exp: 100,
  level: 2,
  effects: [],
  petType: 'fish',
  hatchState: 'hatched',
  mood: 100,
  lastInteractionTime: Date.now(),
  createdAt: Date.now(),
  ...overrides,
});

describe('getStudentPetVisual', () => {
  it('uses contrasting backgrounds for hatched pets instead of reusing muddy egg colors', () => {
    expect(getStudentPetVisual(createStudent({ petType: 'fish', eggColor: 'blue' })).bg).not.toBe('bg-blue-400');
    expect(getStudentPetVisual(createStudent({ petType: 'dragon', eggColor: 'green' })).bg).not.toBe('bg-green-400');
  });

  it('keeps egg backgrounds on unhatched students', () => {
    expect(getStudentPetVisual(createStudent({ hatchState: 'egg', level: 1, eggColor: 'purple' })).bg).toBe('bg-purple-400');
  });
});
