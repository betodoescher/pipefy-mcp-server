import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  cycleTimeHours,
  leadTimeHours,
  computePhaseDistribution,
  computeBottlenecks,
  classifySla,
  computeSlaCompliance,
} from '../metrics.js'
import { mean } from '../pagination.js'
import { makeCard, makePhaseHistory } from './fixtures.js'
import type { CardNode } from '../generated/graphql.js'

// ---- Property 5: Cycle time correctness ----
describe('cycleTimeHours — Property 5', () => {
  it('equals sum of non-done phase durations / 3600', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            done: fc.boolean(),
            duration: fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 86400 })),
          }),
          { minLength: 0, maxLength: 10 },
        ),
        (entries) => {
          const card = makeCard({
            finished_at: '2024-02-01T00:00:00Z',
            phase_history: makePhaseHistory(entries),
          })
          const expected =
            entries
              .filter((e) => !e.done && e.duration !== null)
              .reduce((s, e) => s + (e.duration ?? 0), 0) / 3600
          expect(cycleTimeHours(card)).toBeCloseTo(expected, 6)
        },
      ),
    )
  })

  it('counts each phase at most once', () => {
    const card = makeCard({
      finished_at: '2024-02-01T00:00:00Z',
      phase_history: makePhaseHistory([
        { done: false, duration: 3600 },
        { done: false, duration: 7200 },
        { done: true, duration: 1800 },
      ]),
    })
    // only non-done phases: 3600 + 7200 = 10800s = 3h
    expect(cycleTimeHours(card)).toBeCloseTo(3, 6)
  })
})

// ---- Property 6: Lead time correctness ----
describe('leadTimeHours — Property 6', () => {
  it('equals (finished_at - created_at) in hours', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 * 24 * 3600 * 1000 }),
        (diffMs) => {
          const created = new Date('2024-01-01T00:00:00Z')
          const finished = new Date(created.getTime() + diffMs)
          const card = makeCard({
            created_at: created.toISOString(),
            finished_at: finished.toISOString(),
          })
          expect(leadTimeHours(card)).toBeCloseTo(diffMs / 3_600_000, 4)
        },
      ),
    )
  })

  it('lead time >= cycle time when lead time covers all phase durations', () => {
    // Generate phases with total duration <= totalMs so lead time >= cycle time is guaranteed
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            done: fc.boolean(),
            // keep individual durations small so their sum stays below totalMs
            duration: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        fc.integer({ min: 3600000, max: 86400000 * 30 }),
        (entries, totalMs) => {
          const created = new Date('2024-01-01T00:00:00Z')
          const finished = new Date(created.getTime() + totalMs)
          const card = makeCard({
            created_at: created.toISOString(),
            finished_at: finished.toISOString(),
            phase_history: makePhaseHistory(entries),
          })
          // cycle time in seconds = sum of non-done durations
          const cycleSec = entries
            .filter((e) => !e.done)
            .reduce((s, e) => s + e.duration, 0)
          // only assert when cycle time fits within lead time
          if (cycleSec / 3600 <= totalMs / 3_600_000 + 0.001) {
            expect(leadTimeHours(card)).toBeGreaterThanOrEqual(cycleTimeHours(card) - 0.001)
          }
        },
      ),
    )
  })
})

// ---- Property 8: Phase distribution sums to 100% ----
describe('computePhaseDistribution — Property 8', () => {
  it('percentages sum to 100 for any non-empty active card set', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ phaseId: fc.string({ minLength: 1, maxLength: 5 }) }),
          { minLength: 1, maxLength: 20 },
        ),
        (entries) => {
          const cards: CardNode[] = entries.map((e, i) =>
            makeCard({ id: `c${i}`, current_phase: { id: e.phaseId, name: e.phaseId }, finished_at: null }),
          )
          const dist = computePhaseDistribution(cards)
          const sum = dist.reduce((s, d) => s + d.percentage, 0)
          expect(sum).toBeCloseTo(100, 1)
        },
      ),
    )
  })
})

// ---- Property 9: Bottleneck ordering ----
describe('computeBottlenecks — Property 9', () => {
  it('returns only phases above pipe-wide average, sorted descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            phaseId: fc.string({ minLength: 1, maxLength: 3 }),
            ageMs: fc.integer({ min: 1000, max: 86400000 * 30 }),
          }),
          { minLength: 2, maxLength: 10 },
        ),
        (entries) => {
          const now = Date.now()
          const cards: CardNode[] = entries.map((e, i) =>
            makeCard({
              id: `c${i}`,
              current_phase: { id: e.phaseId, name: e.phaseId },
              created_at: new Date(now - e.ageMs).toISOString(),
              finished_at: null,
            }),
          )
          const bottlenecks = computeBottlenecks(cards, now)
          // All returned phases must be above pipe avg
          for (const b of bottlenecks) {
            expect(b.avg_age_hours).toBeGreaterThan(b.pipe_avg_age_hours)
          }
          // Must be sorted descending
          for (let i = 1; i < bottlenecks.length; i++) {
            expect(bottlenecks[i - 1].avg_age_hours).toBeGreaterThanOrEqual(bottlenecks[i].avg_age_hours)
          }
        },
      ),
    )
  })
})

// ---- Property 10: SLA status classification ----
describe('classifySla — Property 10', () => {
  const now = new Date('2024-06-01T12:00:00Z').getTime()

  it('violated when past due and not done', () => {
    const card = makeCard({ due_date: '2024-05-31T00:00:00Z', finished_at: null, phase_history: [] })
    expect(classifySla(card, now)).toBe('violated')
  })

  it('at_risk when due within 24h and not done', () => {
    const dueIn12h = new Date(now + 12 * 3_600_000).toISOString()
    const card = makeCard({ due_date: dueIn12h, finished_at: null, phase_history: [] })
    expect(classifySla(card, now)).toBe('at_risk')
  })

  it('within_sla when due is far in the future', () => {
    const dueIn48h = new Date(now + 48 * 3_600_000).toISOString()
    const card = makeCard({ due_date: dueIn48h, finished_at: null, phase_history: [] })
    expect(classifySla(card, now)).toBe('within_sla')
  })

  it('within_sla when no due_date', () => {
    const card = makeCard({ due_date: null, finished_at: null, phase_history: [] })
    expect(classifySla(card, now)).toBe('within_sla')
  })

  it('property: violated iff past due and not done', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -30 * 86400000, max: 30 * 86400000 }),
        fc.boolean(),
        (offsetMs, isDone) => {
          const due = new Date(now + offsetMs).toISOString()
          const card = makeCard({
            due_date: due,
            finished_at: isDone ? '2024-05-30T00:00:00Z' : null,
            phase_history: [],
          })
          const status = classifySla(card, now)
          if (offsetMs < 0 && !isDone) {
            expect(status).toBe('violated')
          } else if (isDone) {
            expect(status).not.toBe('violated')
          }
        },
      ),
    )
  })
})

// ---- Property 11: SLA violations filter ----
describe('SLA violations filter — Property 11', () => {
  it('returns exactly cards where due_date < now and not done', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            offsetMs: fc.integer({ min: -10 * 86400000, max: 10 * 86400000 }),
            isDone: fc.boolean(),
          }),
          { minLength: 0, maxLength: 20 },
        ),
        (entries) => {
          const now = Date.now()
          const cards = entries.map((e, i) =>
            makeCard({
              id: `c${i}`,
              due_date: new Date(now + e.offsetMs).toISOString(),
              finished_at: e.isDone ? new Date(now - 1000).toISOString() : null,
              phase_history: [],
            }),
          )
          const violations = cards.filter((c) => classifySla(c, now) === 'violated')
          const expected = cards.filter(
            (c) => c.due_date && new Date(c.due_date).getTime() < now && !c.finished_at,
          )
          expect(violations.map((c) => c.id).sort()).toEqual(expected.map((c) => c.id).sort())
        },
      ),
    )
  })
})

// ---- Property 12: SLA compliance percentages sum to 100% ----
describe('computeSlaCompliance — Property 12', () => {
  it('on_time + violated = 100 for any non-empty set', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            finished_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map((d) => d.toISOString()),
            due_date: fc.oneof(
              fc.constant(null),
              fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map((d) => d.toISOString()),
            ),
          }),
          { minLength: 1, maxLength: 30 },
        ),
        (cards) => {
          const result = computeSlaCompliance(cards)
          expect(result.on_time_percentage + result.violated_percentage).toBeCloseTo(100, 1)
        },
      ),
    )
  })
})
