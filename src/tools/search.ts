import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { fetchAllCards } from '../pagination.js'
import type { Config } from '../config.js'

export function searchTools(client: PipefyClient, config: Config): ToolDefinition[] {
  return [
    {
      name: 'list_cards',
      description: 'List all cards in a pipe with optional filters. Auto-paginates.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        phase_id: z.string().optional(),
        assignee_ids: z.array(z.string()).optional(),
        labels: z.array(z.string()).optional(),
        due_date_gte: z.string().optional(),
        due_date_lte: z.string().optional(),
        search: z.string().optional(),
        max_results: z.number().int().positive().default(500),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            phase_id: z.string().optional(),
            assignee_ids: z.array(z.string()).optional(),
            labels: z.array(z.string()).optional(),
            due_date_gte: z.string().optional(),
            due_date_lte: z.string().optional(),
            search: z.string().optional(),
            max_results: z.number().int().positive().default(500),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const { cards, truncated } = await fetchAllCards(
              client,
              p.pipe_id,
              p.max_results,
              config.PIPEFY_PAGE_SIZE,
            )
            let filtered = cards
            if (p.phase_id) filtered = filtered.filter((c) => c.current_phase.id === p.phase_id)
            if (p.assignee_ids?.length)
              filtered = filtered.filter((c) =>
                c.assignees.some((a) => p.assignee_ids!.includes(a.id)),
              )
            if (p.search) {
              const q = p.search.toLowerCase()
              filtered = filtered.filter((c) => c.title.toLowerCase().includes(q))
            }
            if (p.due_date_gte)
              filtered = filtered.filter(
                (c) => c.due_date && c.due_date >= p.due_date_gte!,
              )
            if (p.due_date_lte)
              filtered = filtered.filter(
                (c) => c.due_date && c.due_date <= p.due_date_lte!,
              )
            return ok({ cards: filtered, truncated, total: filtered.length })
          },
        ),
    },
    {
      name: 'search_cards_by_field',
      description: 'Find cards where a specific field has a given value.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        field_id: z.string().min(1),
        field_value: z.string(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), field_id: z.string().min(1), field_value: z.string() }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            sanitizeString(p.field_id)
            const { cards } = await fetchAllCards(client, p.pipe_id, 500, config.PIPEFY_PAGE_SIZE)
            const matched = cards.filter((c) =>
              c.fields.some(
                (f) => f.field.id === p.field_id && (f.value === p.field_value || f.array_value?.includes(p.field_value)),
              ),
            )
            return ok(matched)
          },
        ),
    },
    {
      name: 'get_overdue_cards',
      description: 'Get cards with a past due date in a pipe.',
      inputSchema: z.object({ pipe_id: z.string().min(1), phase_id: z.string().optional() }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), phase_id: z.string().optional() }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const now = new Date().toISOString()
            const { cards } = await fetchAllCards(client, p.pipe_id, 500, config.PIPEFY_PAGE_SIZE)
            let filtered = cards.filter((c) => c.due_date && c.due_date < now && !c.finished_at)
            if (p.phase_id) filtered = filtered.filter((c) => c.current_phase.id === p.phase_id)
            filtered.sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
            return ok(filtered)
          },
        ),
    },
    {
      name: 'get_unassigned_cards',
      description: 'Get active cards with no assignee.',
      inputSchema: z.object({ pipe_id: z.string().min(1), phase_id: z.string().optional() }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), phase_id: z.string().optional() }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const { cards } = await fetchAllCards(client, p.pipe_id, 500, config.PIPEFY_PAGE_SIZE)
            let filtered = cards.filter((c) => c.assignees.length === 0 && !c.finished_at)
            if (p.phase_id) filtered = filtered.filter((c) => c.current_phase.id === p.phase_id)
            return ok(filtered)
          },
        ),
    },
    {
      name: 'get_stale_cards',
      description: 'Get cards that have not been updated in N days.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        phase_id: z.string().optional(),
        days: z.number().int().positive(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            phase_id: z.string().optional(),
            days: z.number().int().positive(),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const threshold = new Date(Date.now() - p.days * 86400 * 1000).toISOString()
            const { cards } = await fetchAllCards(client, p.pipe_id, 500, config.PIPEFY_PAGE_SIZE)
            let filtered = cards.filter((c) => !c.finished_at && c.updated_at < threshold)
            if (p.phase_id) filtered = filtered.filter((c) => c.current_phase.id === p.phase_id)
            return ok(filtered)
          },
        ),
    },
  ]
}
