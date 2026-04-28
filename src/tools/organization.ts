import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { GET_ORGANIZATION } from '../graphql/queries/getOrganization.js'
import { LIST_ORGANIZATION_MEMBERS } from '../graphql/queries/listOrganizationMembers.js'
import { LIST_PIPE_MEMBERS } from '../graphql/queries/listPipeMembers.js'
import { INVITE_MEMBER_TO_PIPE } from '../graphql/mutations/inviteMember.js'
import { REMOVE_MEMBER_FROM_PIPE } from '../graphql/mutations/removeMember.js'

export function organizationTools(client: PipefyClient): ToolDefinition[] {
  return [
    {
      name: 'get_organization',
      description: 'Get organization details: name, plan, member count and pipes.',
      inputSchema: z.object({ organization_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ organization_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.organization_id)
          const res = await client.request(GET_ORGANIZATION, { id: p.organization_id })
          const org = res.organization
          return ok({
            id: org?.id,
            name: org?.name,
            member_count: org?.members.length ?? 0,
            pipe_count: org?.pipes.length ?? 0,
          })
        }),
    },
    {
      name: 'list_organization_members',
      description: 'List all members of an organization with their roles.',
      inputSchema: z.object({ organization_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ organization_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.organization_id)
          const res = await client.request(LIST_ORGANIZATION_MEMBERS, {
            organizationId: p.organization_id,
          })
          return ok(res.organization?.members ?? [])
        }),
    },
    {
      name: 'list_pipe_members',
      description: 'List members of a specific pipe with their roles.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const res = await client.request(LIST_PIPE_MEMBERS, { pipeId: p.pipe_id })
          return ok(res.pipe?.members ?? [])
        }),
    },
    {
      name: 'invite_member_to_pipe',
      description: 'Invite a user to a pipe by email.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        email: z.string().email(),
        role: z.enum(['admin', 'member']).default('member'),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            email: z.string().email(),
            role: z.enum(['admin', 'member']).default('member'),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const res = await client.request(INVITE_MEMBER_TO_PIPE, {
              input: { pipe_id: p.pipe_id, email: p.email, role_name: p.role as string },
            })
            return ok(res.createPipeMember?.pipe_member)
          },
        ),
    },
    {
      name: 'remove_member_from_pipe',
      description: 'Remove a member from a pipe.',
      inputSchema: z.object({ pipe_id: z.string().min(1), member_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(
          z.object({ pipe_id: z.string().min(1), member_id: z.string().min(1) }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            sanitizeString(p.member_id)
            const res = await client.request(REMOVE_MEMBER_FROM_PIPE, {
              input: { pipe_id: p.pipe_id, member_id: p.member_id },
            })
            return ok({ success: res.destroyPipeMember?.success })
          },
        ),
    },
  ]
}
