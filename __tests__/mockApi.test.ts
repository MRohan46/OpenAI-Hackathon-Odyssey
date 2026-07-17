import { mockApi, resetMockApiForTests } from '../src/api/mockApi';
import { initialQuests } from '../src/data/mockData';

describe('mock API product semantics', () => {
  beforeEach(() => resetMockApiForTests());

  it('returns a server-style receipt before rewards and boss health can move', async () => {
    const source = initialQuests.find((quest) => quest.id === 'quest-calculus');
    expect(source).toBeDefined();

    const result = await mockApi.quests.complete('quest-calculus', {
      actualIntensity: 'intense',
      clientMutationId: 'test-completion-1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok || !source) return;
    expect(result.data.quest.status).toBe('completed');
    expect(result.data.quest.plannedIntensity).toBe(source.plannedIntensity);
    expect(result.data.quest.actualIntensity).toBe('intense');
    expect(result.data.rewards).toEqual({ xp: source.rewardXp, rubies: source.rewardRubies });
    expect(result.data.bossHealth).toBe(55);
  });

  it('does not confirm a proof-required quest without proof', async () => {
    const created = await mockApi.quests.create({
      goalId: 'goal-math',
      title: 'Private practice evidence',
      description: 'A synthetic proof-required test quest.',
      kind: 'habit',
      status: 'scheduled',
      scheduledAt: '2026-07-18T19:00:00+05:30',
      durationMinutes: 25,
      priority: 'high',
      plannedIntensity: 'normal',
      proofPolicy: 'required',
      rewardXp: 60,
      rewardRubies: 8,
      bossDamage: 4,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await mockApi.quests.complete(created.data.id, {
      actualIntensity: 'normal',
      clientMutationId: 'test-completion-2',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation');
    expect(result.error.message).toContain('photo proof');
  });

  it('keeps an AI-generated roadmap a proposal until accept is called', async () => {
    const before = await mockApi.goals.list();
    const proposal = await mockApi.roadmaps.generate({
      goalTitle: 'Learn ocean photography',
      deadline: '2026-12-01',
      startingPoint: 'Beginner',
      availableDays: ['Sat'],
      minutesPerDay: 60,
      preferredIntensity: 'light',
      constraints: 'No underwater equipment yet.',
    });
    const afterProposal = await mockApi.goals.list();
    expect(before.ok && afterProposal.ok && afterProposal.data).toHaveLength(before.ok ? before.data.length : 0);
    expect(proposal.ok).toBe(true);
    if (!proposal.ok) return;

    const accepted = await mockApi.roadmaps.accept(proposal.data);
    expect(accepted.ok).toBe(true);
    const afterAccept = await mockApi.goals.list();
    expect(afterAccept.ok && afterAccept.data).toHaveLength((before.ok ? before.data.length : 0) + 1);
  });

  it('keeps proof and reminder integrations behind typed replaceable boundaries', async () => {
    const target = await mockApi.proof.requestUploadTarget({
      fileName: 'synthetic-proof.jpg',
      contentType: 'image/jpeg',
    });
    expect(target.ok).toBe(true);
    if (!target.ok) return;
    expect(target.data.objectKey).toContain('mock-user/completions/');

    const attached = await mockApi.proof.attach({
      completionId: 'completion-synthetic',
      objectKey: target.data.objectKey,
      capturedAt: '2026-07-17T19:00:00.000Z',
    });
    expect(attached.ok).toBe(true);
    if (!attached.ok) return;

    const privateUrl = await mockApi.proof.getPrivateUrl(attached.data.id);
    expect(privateUrl.ok).toBe(true);
    expect(privateUrl.ok && privateUrl.data.url).toContain('private.invalid');

    const updated = await mockApi.notifications.updateReminderPreferences({
      questReminders: true,
      deadlineReminders: false,
      overdueReminders: true,
      reminderLeadMinutes: 30,
    });
    expect(updated.ok && updated.data.reminderLeadMinutes).toBe(30);
  });
});
