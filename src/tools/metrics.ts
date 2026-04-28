import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { fetchAllCards, mean, median, percentile } from '../pagination.js'
import { cycleTimeHours, leadTimeHours, computePhaseDistribution, computeBottlenecks } from '../metrics.js'
import type { Config } from '../config.js'
import type { CardNode } from '../generated/graphql.js'

function completedCards(cards: CardNode[]) {
  return cards.filter((c) => c.finished_at !== null)
}

function getWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function metricsTools(client: PipefyClient, config: Config): ToolDefinition[] {
  return [
    {
      name: 'get_cycle_time',
      description: 'Average time cards spend in active (non-done) phases. Returns avg, median, p75, p95 in hours.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        phase_id: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), phase_id: z.string().optional(), from: z.string().optional(), to: z.string().optional() }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
            let done = completedCards(cards)
            if (p.from) done = done.filter((c) => c.finished_at! >= p.from!)
            if (p.to) done = done.filter((c) => c.finished_at! <= p.to!)
            const values = done.map(cycleTimeHours).sort((a, b) => a - b)
            return ok({
              pipe_id: p.pipe_id,
              card_count: values.length,
              average_hours: mean(values),
              median_hours: median(values),
              p75_hours: percentile(values, 75),
              p95_hours: percentile(values, 95),
              date_range: p.from || p.to ? { from: p.from, to: p.to } : undefined,
            })
          },
        ),
    },
    {
      name: 'get_lead_time',
      description: 'Average total time from card creation to completion. Returns avg, median, p75, p95 in hours.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), from: z.string().optional(), to: z.string().optional() }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
            let done = completedCards(cards)
            if (p.from) done = done.filter((c) => c.finished_at! >= p.from!)
            if (p.to) done = done.filter((c) => c.finished_at! <= p.to!)
            const values = done.map(leadTimeHours).sort((a, b) => a - b)
            return ok({
              pipe_id: p.pipe_id,
              card_count: values.length,
              average_hours: mean(values),
              median_hours: median(values),
              p75_hours: percentile(values, 75),
              p95_hours: percentile(values, 95),
              date_range: p.from || p.to ? { from: p.from, to: p.to } : undefined,
            })
          },
        ),
    },
    {
      name: 'get_throughput',
      description: 'Number of cards completed in a period, broken down by week or month.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        from: z.string(),
        to: z.string(),
        granularity: z.enum(['weekly', 'monthly']).default('weekly'),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            from: z.string(),
            to: z.string(),
            granularity: z.enum(['weekly', 'monthly']).default('weekly'),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
            const done = completedCards(cards).filter(
              (c) => c.finished_at! >= p.from && c.finished_at! <= p.to,
            )
            const buckets: Record<string, number> = {}
            for (const card of done) {
              const d = new Date(card.finished_at!)
              const key =
                p.granularity === 'weekly'
                  ? `${d.getFullYear()}-W${String(getWeek(d)).padStart(2, '0')}`
                  : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
              buckets[key] = (buckets[key] ?? 0) + 1
            }
            return ok({
              pipe_id: p.pipe_id,
              completed_count: done.length,
              granularity: p.granularity,
              breakdown: Object.entries(buckets)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([period, count]) => ({ period, count })),
            })
          },
        ),
    },
    {
      name: 'get_phase_distribution',
      description: 'Current snapshot of how many cards are in each phase.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
          return ok(computePhaseDistribution(cards))
        }),
    },
    {
      name: 'get_creation_vs_completion',
      description: 'Cards created vs completed per period — shows if the pipe is accumulating work.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        from: z.string(),
        to: z.string(),
        granularity: z.enum(['weekly', 'monthly']).default('weekly'),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            from: z.string(),
            to: z.string(),
            granularity: z.enum(['weekly', 'monthly']).default('weekly'),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
            const created = cards.filter((c) => c.created_at >= p.from && c.created_at <= p.to)
            const done = completedCards(cards).filter(
              (c) => c.finished_at! >= p.from && c.finished_at! <= p.to,
            )
            const bucketKey = (d: Date) =>
              p.granularity === 'weekly'
                ? `${d.getFullYear()}-W${String(getWeek(d)).padStart(2, '0')}`
                : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const createdBuckets: Record<string, number> = {}
            const doneBuckets: Record<string, number> = {}
            for (const c of created) {
              const k = bucketKey(new Date(c.created_at))
              createdBuckets[k] = (createdBuckets[k] ?? 0) + 1
            }
            for (const c of done) {
              const k = bucketKey(new Date(c.finished_at!))
              doneBuckets[k] = (doneBuckets[k] ?? 0) + 1
            }
            const allKeys = [...new Set([...Object.keys(createdBuckets), ...Object.keys(doneBuckets)])].sort()
            return ok({
              pipe_id: p.pipe_id,
              breakdown: allKeys.map((period) => ({
                period,
                created: createdBuckets[period] ?? 0,
                completed: doneBuckets[period] ?? 0,
              })),
            })
          },
        ),
    },
    {
      name: 'get_bottlenecks',
      description: 'Phases with above-average card age — identifies where work is stuck.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
          return ok(computeBottlenecks(cards, Date.now()))
        }),
    },
  ]
}
