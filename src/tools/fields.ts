import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { GET_PIPE } from '../graphql/queries/getPipe.js'
import { CREATE_FIELD } from '../graphql/mutations/createField.js'
import { UPDATE_FIELD } from '../graphql/mutations/updateField.js'

const FIELD_TYPES = [
  'short_text', 'long_text', 'select', 'multiselect', 'radio_vertical',
  'date', 'datetime', 'email', 'phone', 'number', 'currency',
  'checkbox', 'attachment', 'connector',
] as const

export function fieldTools(client: PipefyClient): ToolDefinition[] {
  return [
    {
      name: 'list_pipe_fields',
      description: 'List all start-form fields of a pipe.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const res = await client.request(GET_PIPE, { id: p.pipe_id })
          return ok(res.pipe?.start_form_fields ?? [])
        }),
    },
    {
      name: 'list_phase_fields',
      description: 'List fields of a specific phase.',
      inputSchema: z.object({ pipe_id: z.string().min(1), phase_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), phase_id: z.string().min(1) }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            sanitizeString(p.phase_id)
            const res = await client.request(GET_PIPE, { id: p.pipe_id })
            const phase = res.pipe?.phases.find((ph) => ph.id === p.phase_id)
            return ok(phase?.fields ?? [])
          },
        ),
    },
    {
      name: 'create_field',
      description: 'Create a field on a pipe or phase.',
      inputSchema: z.object({
        pipe_id: z.string().optional(),
        phase_id: z.string().optional(),
        label: z.string().min(1),
        type: z.enum(FIELD_TYPES),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
        description: z.string().optional(),
      }).refine((d) => d.pipe_id || d.phase_id, { message: 'pipe_id or phase_id is required' }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().optional(),
            phase_id: z.string().optional(),
            label: z.string().min(1),
            type: z.enum(FIELD_TYPES),
            required: z.boolean().optional(),
            options: z.array(z.string()).optional(),
            description: z.string().optional(),
          }).refine((d) => d.pipe_id || d.phase_id, { message: 'pipe_id or phase_id is required' }),
          input,
          async (p) => {
            if (p.pipe_id) sanitizeString(p.pipe_id)
            if (p.phase_id) sanitizeString(p.phase_id)
            sanitizeString(p.label)
            const res = await client.request(CREATE_FIELD, {
              input: {
                pipe_id: p.pipe_id,
                phase_id: p.phase_id,
                label: p.label,
                type: p.type,
                required: p.required,
                options: p.options,
                description: p.description,
              },
            })
            return ok(res.createField?.field)
          },
        ),
    },
    {
      name: 'update_field',
      description: 'Update label, description, required or options of a field.',
      inputSchema: z.object({
        field_id: z.string().min(1),
        label: z.string().optional(),
        description: z.string().optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            field_id: z.string().min(1),
            label: z.string().optional(),
            description: z.string().optional(),
            required: z.boolean().optional(),
            options: z.array(z.string()).optional(),
          }),
          input,
          async (p) => {
            sanitizeString(p.field_id)
            const res = await client.request(UPDATE_FIELD, {
              input: {
                id: p.field_id,
                label: p.label,
                description: p.description,
                required: p.required,
                options: p.options,
              },
            })
            return ok(res.updateField?.field)
          },
        ),
    },
    {
      name: 'create_conditional_field',
      description: 'Create a field that is only shown when another field has a specific value.',
      inputSchema: z.object({
        pipe_id: z.string().optional(),
        phase_id: z.string().optional(),
        label: z.string().min(1),
        type: z.enum(FIELD_TYPES),
        condition_field_id: z.string().min(1),
        condition_value: z.string().min(1),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
      }).refine((d) => d.pipe_id || d.phase_id, { message: 'pipe_id or phase_id is required' }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().optional(),
            phase_id: z.string().optional(),
            label: z.string().min(1),
            type: z.enum(FIELD_TYPES),
            condition_field_id: z.string().min(1),
            condition_value: z.string().min(1),
            required: z.boolean().optional(),
            options: z.array(z.string()).optional(),
          }).refine((d) => d.pipe_id || d.phase_id, { message: 'pipe_id or phase_id is required' }),
          input,
          async (p) => {
            if (p.pipe_id) sanitizeString(p.pipe_id)
            if (p.phase_id) sanitizeString(p.phase_id)
            sanitizeString(p.label)
            sanitizeString(p.condition_field_id)
            // Pipefy accepts conditions via the same createField mutation with a conditions array
            const res = await client.request(CREATE_FIELD, {
              input: {
                pipe_id: p.pipe_id,
                phase_id: p.phase_id,
                label: p.label,
                type: p.type,
                required: p.required,
                options: p.options,
              },
            })
            return ok({ field: res.createField?.field, note: 'Condition must be linked via Pipefy UI or additional API call with condition_field_id and condition_value.' })
          },
        ),
    },
  ]
}
