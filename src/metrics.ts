import type { CardNode, PhaseHistoryEntry } from './generated/graphql.js'
import type { SlaStatus } from './types/pipefy.js'

// ---- Metric helpers (pure, exported for testing) ----

export function cycleTimeHours(card: CardNode): number {
  const nonDone = card.phase_history.filter((h) => !h.phase.done && h.duration !== null)
  return nonDone.reduce((sum, h) => sum + (h.duration ?? 0), 0) / 3600
}

export function leadTimeHours(card: CardNode): number {
  if (!card.finished_at) return 0
  return (new Date(card.finished_at).getTime() - new Date(card.created_at).getTime()) / 3_600_000
}

export function computePhaseDistribution(
  cards: CardNode[],
): Array<{ phase_id: string; phase_name: string; card_count: number; percentage: number }> {
  const active = cards.filter((c) => !c.finished_at)
  const counts: Record<string, { name: string; count: number }> = {}
  for (const card of active) {
    const { id, name } = card.current_phase
    if (!counts[id]) counts[id] = { name, count: 0 }
    counts[id].count++
  }
  const total = active.length || 1
  return Object.entries(counts).map(([phase_id, { name, count }]) => ({
    phase_id,
    phase_name: name,
    card_count: count,
    percentage: Math.round((count / total) * 10000) / 100,
  }))
}

export function computeBottlenecks(
  cards: CardNode[],
  now: number,
): Array<{ phase_id: string; phase_name: string; avg_age_hours: number; pipe_avg_age_hours: number }> {
  const active = cards.filter((c) => !c.finished_at)
  const phaseAges: Record<string, { name: string; ages: number[] }> = {}
  for (const card of active) {
    const { id, name } = card.current_phase
    if (!phaseAges[id]) phaseAges[id] = { name, ages: [] }
    phaseAges[id].ages.push((now - new Date(card.created_at).getTime()) / 3_600_000)
  }
  const phases = Object.entries(phaseAges).map(([phase_id, { name, ages }]) => ({
    phase_id,
    phase_name: name,
    avg_age_hours: ages.reduce((a, b) => a + b, 0) / ages.length,
  }))
  const pipeAvg = phases.reduce((s, p) => s + p.avg_age_hours, 0) / (phases.length || 1)
  return phases
    .filter((p) => p.avg_age_hours > pipeAvg)
    .sort((a, b) => b.avg_age_hours - a.avg_age_hours)
    .map((p) => ({ ...p, pipe_avg_age_hours: pipeAvg }))
}

// ---- SLA helpers (pure, exported for testing) ----

const SLA_AT_RISK_MS = 24 * 3_600_000

export function classifySla(card: Pick<CardNode, 'due_date' | 'phase_history' | 'finished_at'>, now: number): SlaStatus {
  if (!card.due_date) return 'within_sla'
  const due = new Date(card.due_date).getTime()
  const isDone = card.finished_at !== null || card.phase_history.some((h) => h.phase.done && h.lastTimeOut === null)
  if (due < now && !isDone) return 'violated'
  if (due - now <= SLA_AT_RISK_MS && due >= now && !isDone) return 'at_risk'
  return 'within_sla'
}

export function computeSlaCompliance(
  cards: Array<Pick<CardNode, 'finished_at' | 'due_date'>>,
): { on_time_percentage: number; violated_percentage: number } {
  const total = cards.length || 1
  const onTime = cards.filter((c) => !c.due_date || c.finished_at! <= c.due_date).length
  const violated = total - onTime
  return {
    on_time_percentage: Math.round((onTime / total) * 10000) / 100,
    violated_percentage: Math.round((violated / total) * 10000) / 100,
  }
}
