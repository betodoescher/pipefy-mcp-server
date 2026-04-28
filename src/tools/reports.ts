import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { fetchAllCards, mean } from '../pagination.js'
import { LIST_PIPES } from '../graphql/queries/listPipes.js'
import type { Config } from '../config.js'

export function reportTools(client: PipefyClient, config: Config): ToolDefinition[] {
  return [
    {
      name: 'get_portfolio_report',
      description: 'Consolidated report of all pipes in an organization.',
      inputSchema: z.object({
        organization_id: z.string().min(1),
        format: z.enum(['json', 'markdown']).default('json'),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ organization_id: z.string().min(1), format: z.enum(['json', 'markdown']).default('json') }),
          input,
          async (p) => {
            sanitizeString(p.organization_id)
            const pipesRes = await client.request(LIST_PIPES, { organizationId: p.organization_id })
            const pipes = pipesRes.organization?.pipes ?? []

            const pipeReports = await Promise.all(
              pipes.map(async (pipe) => {
                const { cards } = await fetchAllCards(client, pipe.id, 1000, config.PIPEFY_PAGE_SIZE)
                const active = cards.filter((c) => !c.finished_at)
                const now = Date.now()
                const weekAgo = new Date(now - 7 * 86400 * 1000).toISOString()
                const throughput = cards.filter(
                  (c) => c.finished_at && c.finished_at >= weekAgo,
                ).length
                const phaseCounts: Record<string, number> = {}
                for (const c of active) {
                  phaseCounts[c.current_phase.name] = (phaseCounts[c.current_phase.name] ?? 0) + 1
                }
                const bottleneckPhase = Object.entries(phaseCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null
                return {
                  pipe_id: pipe.id,
                  pipe_name: pipe.name,
                  active_cards: active.length,
                  throughput_last_week: throughput,
                  main_bottleneck: bottleneckPhase,
                }
              }),
            )

            if (p.format === 'markdown') {
              const lines = [
                `# Portfolio Report — Org ${p.organization_id}`,
                '',
                '| Pipe | Active Cards | Throughput (7d) | Main Bottleneck |',
                '|------|-------------|-----------------|-----------------|',
                ...pipeReports.map(
                  (r) => `| ${r.pipe_name} | ${r.active_cards} | ${r.throughput_last_week} | ${r.main_bottleneck ?? '-'} |`,
                ),
              ]
              return ok(lines.join('\n'))
            }
            return ok({ organization_id: p.organization_id, pipes: pipeReports })
          },
        ),
    },
    {
      name: 'get_pipe_report',
      description: 'Full report for a single pipe: card volume, cycle time, lead time, completion rate.',
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
            let done = cards.filter((c) => c.finished_at)
            if (p.from) done = done.filter((c) => c.finished_at! >= p.from!)
            if (p.to) done = done.filter((c) => c.finished_at! <= p.to!)

            const cycleTimes = done.map((c) => {
              const nonDone = c.phase_history.filter((h) => !h.phase.done && h.duration !== null)
              return nonDone.reduce((s, h) => s + (h.duration ?? 0), 0) / 3600
            })
            const leadTimes = done.map(
              (c) => (new Date(c.finished_at!).getTime() - new Date(c.created_at).getTime()) / 3_600_000,
            )
            const active = cards.filter((c) => !c.finished_at)
            const phaseCounts: Record<string, { name: string; count: number }> = {}
            for (const c of active) {
              const { id, name } = c.current_phase
              if (!phaseCounts[id]) phaseCounts[id] = { name, count: 0 }
              phaseCounts[id].count++
            }
            const total = active.length || 1
            return ok({
              pipe_id: p.pipe_id,
              card_volume: cards.length,
              active_cards: active.length,
              completed_cards: done.length,
              completion_rate: Math.round((done.length / (cards.length || 1)) * 10000) / 100,
              avg_cycle_time_hours: mean(cycleTimes),
              avg_lead_time_hours: mean(leadTimes),
              phase_distribution: Object.entries(phaseCounts).map(([phase_id, { name, count }]) => ({
                phase_id,
                phase_name: name,
                card_count: count,
                percentage: Math.round((count / total) * 10000) / 100,
              })),
            })
          },
        ),
    },
    {
      name: 'get_assignee_workload',
      description: 'Open card count and average card age per assignee in a pipe.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const { cards } = await fetchAllCards(client, p.pipe_id, 2000, config.PIPEFY_PAGE_SIZE)
          const active = cards.filter((c) => !c.finished_at)
          const now = Date.now()
          const byAssignee: Record<string, { name: string; cards: number; ages: number[]; overdue: number }> = {}
          for (const card of active) {
            const ageHours = (now - new Date(card.created_at).getTime()) / 3_600_000
            const isOverdue = card.due_date ? new Date(card.due_date).getTime() < now : false
            if (card.assignees.length === 0) {
              if (!byAssignee['unassigned']) byAssignee['unassigned'] = { name: 'Unassigned', cards: 0, ages: [], overdue: 0 }
              byAssignee['unassigned'].cards++
              byAssignee['unassigned'].ages.push(ageHours)
              if (isOverdue) byAssignee['unassigned'].overdue++
            }
            for (const a of card.assignees) {
              if (!byAssignee[a.id]) byAssignee[a.id] = { name: a.name, cards: 0, ages: [], overdue: 0 }
              byAssignee[a.id].cards++
              byAssignee[a.id].ages.push(ageHours)
              if (isOverdue) byAssignee[a.id].overdue++
            }
          }
          return ok(
            Object.entries(byAssignee)
              .map(([id, { name, cards: open, ages, overdue }]) => ({
                assignee_id: id,
                assignee_name: name,
                open_cards: open,
                overdue_cards: overdue,
                avg_card_age_hours: mean(ages),
              }))
              .sort((a, b) => b.open_cards - a.open_cards),
          )
        }),
    },
  ]
}
