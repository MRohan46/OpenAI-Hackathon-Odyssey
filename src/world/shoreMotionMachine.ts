import { setup } from 'xstate';

export const shoreMotionMachine = setup({
  types: {
    events: {} as
      | { type: 'GLIDE' }
      | { type: 'SETTLE' }
      | { type: 'REDUCE' }
      | { type: 'RESTORE' },
  },
}).createMachine({
  id: 'living-shore-motion',
  initial: 'idle',
  states: {
    idle: { on: { GLIDE: 'gliding', REDUCE: 'reduced' } },
    gliding: { on: { SETTLE: 'settled', REDUCE: 'reduced' } },
    settled: { on: { GLIDE: 'gliding', REDUCE: 'reduced' } },
    reduced: { on: { RESTORE: 'idle' } },
  },
});
