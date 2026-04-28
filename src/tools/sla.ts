import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { fetchAllCards } from '../pagination.js'
import { classifySla, computeSlaCompliance } from '../metrics.js'
import type { Config } from '../config.js'

export function slaTools(client: PipefyClient, config: Config): ToolDefinition[] {
  return [
    {
      name: 'get_sla_status',
      description: 'SLA status for all active cards in a pipe: within_sla, at_risk, or violated.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const now = Date.now()
          const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
          const result = cards
            .filter((c) => !c.finished_at)
            .map((c) => ({
              card_id: c.id,
              title: c.title,
              status: classifySla(c, now),
              due_date: c.due_date,
              phase: c.current_phase.name,
              assignees: c.assignees.map((a) => a.name),
            }))
          const summary = { within_sla: 0, at_risk: 0, violated: 0 }
          for (const r of result) summary[r.status]++
          return ok({ summary, cards: result })
        }),
    },
    {
      name: 'get_sla_violations',
      description: 'Cards with SLA violated (past due, not done).',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        phase_id: z.string().optional(),
        assignee_id: z.string().optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), phase_id: z.string().optional(), assignee_id: z.string().optional() }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const now = Date.now()
            const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
            let violated = cards.filter((c) => classifySla(c, now) === 'violated')
            if (p.phase_id) violated = violated.filter((c) => c.current_phase.id === p.phase_id)
            if (p.assignee_id)
              violated = violated.filter((c) => c.assignees.some((a) => a.id === p.assignee_id))
            return ok(
              violated.map((c) => ({
                card_id: c.id,
                title: c.title,
                due_date: c.due_date,
                days_overdue: c.due_date
                  ? Math.floor((now - new Date(c.due_date).getTime()) / 86_400_000)
                  : null,
                phase: c.current_phase.name,
                assignees: c.assignees.map((a) => a.name),
              })),
            )
          },
        ),
    },
    {
      name: 'get_sla_forecast',
      description: 'Cards at risk of SLA violation within the next N hours.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        hours: z.number().positive().default(24),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), hours: z.number().positive().default(24) }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const now = Date.now()
            const hours = p.hours ?? 24
            const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
            const forecast = cards
              .filter((c) => {
                if (!c.due_date || c.finished_at) return false
                const due = new Date(c.due_date).getTime()
                return due > now && due - now <= hours * 3_600_000
              })
              .map((c) => ({
                card_id: c.id,
                title: c.title,
                due_date: c.due_date,
                hours_until_due: c.due_date
                  ? Math.round((new Date(c.due_date).getTime() - now) / 3_600_000)
                  : null,
                phase: c.current_phase.name,
                assignees: c.assignees.map((a) => a.name),
              }))
              .sort((a, b) => (a.hours_until_due ?? 0) - (b.hours_until_due ?? 0))
            return ok(forecast)
          },
        ),
    },
    {
      name: 'get_sla_compliance_history',
      description: 'SLA compliance % over time (on-time vs violated completions).',
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
            const done = cards.filter(
              (c) => c.finished_at && c.finished_at >= p.from && c.finished_at <= p.to,
            )
            const bucketKey = (d: Date) =>
              p.granularity === 'weekly'
                ? `${d.getFullYear()}-W${String(getWeek(d)).padStart(2, '0')}`
                : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const buckets: Record<string, { on_time: number; violated: number }> = {}
            for (const c of done) {
              const k = bucketKey(new Date(c.finished_at!))
              if (!buckets[k]) buckets[k] = { on_time: 0, violated: 0 }
              const finishedOnTime = !c.due_date || c.finished_at! <= c.due_date
              if (finishedOnTime) buckets[k].on_time++
              else buckets[k].violated++
            }
            return ok(
              Object.entries(buckets)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([period, { on_time, violated }]) => {
                  const total = on_time + violated || 1
                  return {
                    period,
                    on_time_count: on_time,
                    violated_count: violated,
                    on_time_percentage: Math.round((on_time / total) * 10000) / 100,
                    violated_percentage: Math.round((violated / total) * 10000) / 100,
                  }
                }),
            )
          },
        ),
    },
  ]
}

function getWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
