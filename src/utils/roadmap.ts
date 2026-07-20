import type { RoadmapLevel } from '../types/domain';

export const bossTypeForLevel = (number: number): RoadmapLevel['bossType'] => {
  if (number === 10) return 'final';
  if ([3, 6, 8].includes(number)) return 'mini';
  return 'none';
};

/** Keeps milestone placement structural instead of trusting editable client state. */
export const normalizeRoadmapLevels = (levels: RoadmapLevel[]): RoadmapLevel[] => levels.map((level, index) => {
  const number = index + 1;
  const bossType = bossTypeForLevel(number);
  return {
    ...level,
    number,
    bossType,
    bossName: bossType === 'none' ? undefined : level.bossName || (bossType === 'final' ? 'The Final Shore' : `Trial of Level ${number}`),
    bossHealth: bossType === 'none' ? undefined : level.bossHealth ?? 100,
  };
});
