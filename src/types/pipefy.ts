export type SlaStatus = 'within_sla' | 'at_risk' | 'violated'

export interface PhaseHistoryEntry {
  phase: { id: string; name: string; done: boolean }
  firstTimeIn: string
  lastTimeOut: string | null
  duration: number | null
}

export interface CardSummary {
  id: string
  title: string
  current_phase: { id: string; name: string }
  assignees: Array<{ id: string; name: string; email: string }>
  due_date: string | null
  created_at: string
  updated_at: string
  finished_at: string | null
  phase_history: PhaseHistoryEntry[]
}

export interface CycleTimeResult {
  pipe_id: string
  average_hours: number
  median_hours: number
  p75_hours: number
  p95_hours: number
  card_count: number
  date_range?: { from: string; to: string }
}

export interface LeadTimeResult {
  pipe_id: string
  average_hours: number
  median_hours: number
  p75_hours: number
  p95_hours: number
  card_count: number
  date_range?: { from: string; to: string }
}

export interface ThroughputResult {
  pipe_id: string
  completed_count: number
  period_days: number
  granularity?: 'weekly' | 'monthly'
  breakdown?: Array<{ period: string; count: number }>
}

export interface PhaseDistribution {
  phase_id: string
  phase_name: string
  card_count: number
  percentage: number
}

export interface BottleneckResult {
  phase_id: string
  phase_name: string
  avg_age_hours: number
  pipe_avg_age_hours: number
}

export interface SlaStatusResult {
  card_id: string
  title: string
  status: SlaStatus
  due_date: string | null
  phase: string
  assignees: string[]
}

export interface SlaViolation {
  card_id: string
  title: string
  due_date: string
  days_overdue: number
  phase: string
  assignees: string[]
}

export interface SlaForecast {
  card_id: string
  title: string
  due_date: string
  hours_until_due: number
  phase: string
  assignees: string[]
}

export interface SlaComplianceHistory {
  period: string
  on_time_count: number
  violated_count: number
  on_time_percentage: number
  violated_percentage: number
}

export interface AssigneeWorkload {
  assignee_id: string
  assignee_name: string
  open_cards: number
  overdue_cards: number
  avg_card_age_hours: number
}

export interface PipeReport {
  pipe_id: string
  card_volume: number
  avg_cycle_time_hours: number
  avg_lead_time_hours: number
  completion_rate: number
  phase_distribution: PhaseDistribution[]
}

export interface PortfolioReport {
  organization_id: string
  pipes: Array<{
    pipe_id: string
    pipe_name: string
    active_cards: number
    sla_compliance_pct: number
    avg_cycle_time_hours: number
    throughput_last_week: number
    main_bottleneck: string | null
  }>
}
