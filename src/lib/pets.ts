import type { Student, PetType } from './db';

export const HATCH_LEVEL = 2;

const petTypeEmojiMap: Record<PetType, string> = {
  bird: '🐥',
  bunny: '🐰',
  puppy: '🐶',
  fish: '🐟',
  dragon: '🐉',
};

const eggColorMap: Record<string, string> = {
  red: 'bg-red-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  purple: 'bg-purple-400',
  yellow: 'bg-yellow-400',
};

export const isStudentReadyToHatch = (student: Student) =>
  student.level >= HATCH_LEVEL && student.hatchState === 'ready';

export const getPetTypeEmoji = (petType: PetType) => petTypeEmojiMap[petType];

export const getStudentPetVisual = (student: Student) => {
  const readyToHatch = isStudentReadyToHatch(student);
  const face = student.hatchState === 'hatched' ? getPetTypeEmoji(student.petType) : '🥚';

  return {
    face,
    bg: eggColorMap[student.eggColor] || 'bg-gray-400',
    readyToHatch,
    hatched: student.hatchState === 'hatched',
  };
};
