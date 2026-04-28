import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { GET_PIPE } from '../graphql/queries/getPipe.js'
import { LIST_PIPES } from '../graphql/queries/listPipes.js'
import { CREATE_PIPE } from '../graphql/mutations/createPipe.js'
import { CLONE_PIPE } from '../graphql/mutations/clonePipe.js'
import { UPDATE_PIPE } from '../graphql/mutations/updatePipe.js'
import { CREATE_PHASE } from '../graphql/mutations/createPhase.js'
import { UPDATE_PHASE } from '../graphql/mutations/updatePhase.js'

export function pipeTools(client: PipefyClient): ToolDefinition[] {
  return [
    {
      name: 'list_pipes',
      description: 'List all pipes in an organization.',
      inputSchema: z.object({ organization_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ organization_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.organization_id)
          const res = await client.request(LIST_PIPES, { organizationId: p.organization_id })
          return ok(res.organization?.pipes ?? [])
        }),
    },
    {
      name: 'get_pipe',
      description: 'Get full details of a pipe including phases, fields and members.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const res = await client.request(GET_PIPE, { id: p.pipe_id })
          return ok(res.pipe)
        }),
    },
    {
      name: 'get_pipe_phases',
      description: 'List phases of a pipe with card counts.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const res = await client.request(GET_PIPE, { id: p.pipe_id })
          return ok(res.pipe?.phases ?? [])
        }),
    },
    {
      name: 'create_pipe',
      description: 'Create a new pipe in an organization.',
      inputSchema: z.object({
        organization_id: z.string().min(1),
        name: z.string().min(1),
        icon: z.string().optional(),
        phases: z.array(z.object({ name: z.string().min(1) })).optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            organization_id: z.string().min(1),
            name: z.string().min(1),
            icon: z.string().optional(),
            phases: z.array(z.object({ name: z.string().min(1) })).optional(),
          }),
          input,
          async (p) => {
            sanitizeString(p.organization_id)
            sanitizeString(p.name)
            const res = await client.request(CREATE_PIPE, {
              input: { organization_id: p.organization_id, name: p.name, icon: p.icon, phases: p.phases },
            })
            return ok(res.createPipe?.pipe)
          },
        ),
    },
    {
      name: 'clone_pipe',
      description: 'Clone an existing pipe (structure only, no cards).',
      inputSchema: z.object({ pipe_id: z.string().min(1), new_name: z.string().min(1) }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), new_name: z.string().min(1) }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const res = await client.request(CLONE_PIPE, {
              input: { pipe_id: p.pipe_id, name: p.new_name },
            })
            return ok(res.clonePipe?.pipe)
          },
        ),
    },
    {
      name: 'update_pipe',
      description: 'Update pipe name or icon.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        name: z.string().optional(),
        icon: z.string().optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), name: z.string().optional(), icon: z.string().optional() }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const res = await client.request(UPDATE_PIPE, {
              input: { id: p.pipe_id, name: p.name, icon: p.icon },
            })
            return ok(res.updatePipe?.pipe)
          },
        ),
    },
    {
      name: 'create_phase',
      description: 'Create a new phase in a pipe.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        name: z.string().min(1),
        only_admin_can_move_to_previous: z.boolean().optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            name: z.string().min(1),
            only_admin_can_move_to_previous: z.boolean().optional(),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const res = await client.request(CREATE_PHASE, {
              input: {
                pipe_id: p.pipe_id,
                name: p.name,
                only_admin_can_move_to_previous: p.only_admin_can_move_to_previous,
              },
            })
            return ok(res.createPhase?.phase)
          },
        ),
    },
    {
      name: 'update_phase',
      description: 'Update a phase name.',
      inputSchema: z.object({ phase_id: z.string().min(1), name: z.string().optional() }),
      handler: (input) =>
        safeHandler(
          z.object({ phase_id: z.string().min(1), name: z.string().optional() }),
          input,
          async (p) => {
            sanitizeString(p.phase_id)
            const res = await client.request(UPDATE_PHASE, {
              input: { id: p.phase_id, name: p.name },
            })
            return ok(res.updatePhase?.phase)
          },
        ),
    },
  ]
}
