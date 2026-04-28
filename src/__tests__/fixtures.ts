// Shared test fixtures and builders

import type { CardNode, PhaseHistoryEntry } from '../generated/graphql.js'

export function makePhaseHistory(entries: Array<{
  id?: string
  name?: string
  done?: boolean
  duration?: number | null
  lastTimeOut?: string | null
}>): PhaseHistoryEntry[] {
  return entries.map((e, i) => ({
    phase: { id: e.id ?? `phase-${i}`, name: e.name ?? `Phase ${i}`, done: e.done ?? false },
    firstTimeIn: '2024-01-01T00:00:00Z',
    lastTimeOut: e.lastTimeOut !== undefined ? e.lastTimeOut : '2024-01-02T00:00:00Z',
    // preserve null explicitly; default to 3600 only when undefined
    duration: e.duration !== undefined ? e.duration : 3600,
  }))
}

export function makeCard(overrides: Partial<CardNode> = {}): CardNode {
  return {
    id: 'card-1',
    title: 'Test Card',
    current_phase: { id: 'phase-1', name: 'In Progress' },
    fields: [],
    assignees: [],
    due_date: null,
    labels: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    finished_at: null,
    comments_count: 0,
    child_relations: [],
    phase_history: [],
    ...overrides,
  }
}
