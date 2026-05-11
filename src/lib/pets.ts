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

const hatchedPetBackgroundMap: Record<PetType, string> = {
  bird: 'bg-sky-200',
  bunny: 'bg-pink-200',
  puppy: 'bg-amber-200',
  fish: 'bg-cyan-200',
  dragon: 'bg-lime-200',
};

export const isStudentReadyToHatch = (student: Student) =>
  student.level >= HATCH_LEVEL && student.hatchState === 'ready';

export const getPetTypeEmoji = (petType: PetType) => petTypeEmojiMap[petType];

export const getStudentPetVisual = (student: Student) => {
  const readyToHatch = isStudentReadyToHatch(student);
  const hatched = student.hatchState === 'hatched';
  const face = hatched ? getPetTypeEmoji(student.petType) : '🥚';

  return {
    face,
    bg: hatched ? hatchedPetBackgroundMap[student.petType] : eggColorMap[student.eggColor] || 'bg-gray-400',
    readyToHatch,
    hatched,
  };
};
