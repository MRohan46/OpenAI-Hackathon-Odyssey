import type { RoadmapLevel } from '../src/types/domain';
import { normalizeRoadmapLevels } from '../src/utils/roadmap';

const levels = Array.from({ length: 10 }, (_, index): RoadmapLevel => ({
  id: `level-${index + 1}`,
  number: index + 1,
  title: `Level ${index + 1}`,
  purpose: '',
  status: index === 0 ? 'active' : 'locked',
  milestone: '',
  bossType: index === 9 ? 'final' : 'none',
  bossName: index === 9 ? 'Finish strong' : undefined,
  bossHealth: index === 9 ? 100 : undefined,
  habits: [],
  tasks: [],
}));

describe('normalizeRoadmapLevels', () => {
  it('derives milestone bosses from final positions after a reorder', () => {
    const reordered = [...levels];
    [reordered[0], reordered[9]] = [reordered[9], reordered[0]];

    const result = normalizeRoadmapLevels(reordered);

    expect(result.map((level) => level.bossType)).toEqual(['none', 'none', 'mini', 'none', 'none', 'mini', 'none', 'mini', 'none', 'final']);
    expect(result[0].bossName).toBeUndefined();
    expect(result[9].bossName).toBe('The Final Shore');
  });
});
