import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { LIST_AUTOMATIONS } from '../graphql/queries/listAutomations.js'
import { LIST_WEBHOOKS } from '../graphql/queries/listWebhooks.js'
import { CREATE_AUTOMATION } from '../graphql/mutations/createAutomation.js'
import { TOGGLE_AUTOMATION } from '../graphql/mutations/toggleAutomation.js'
import { DELETE_AUTOMATION } from '../graphql/mutations/deleteAutomation.js'
import { CREATE_WEBHOOK } from '../graphql/mutations/createWebhook.js'
import { DELETE_WEBHOOK } from '../graphql/mutations/deleteWebhook.js'

const WEBHOOK_ACTIONS = [
  'card.create', 'card.done', 'card.expired', 'card.late',
  'card.move', 'card.overdue', 'card.field_update',
] as const

export function automationTools(client: PipefyClient): ToolDefinition[] {
  return [
    {
      name: 'list_automations',
      description: 'List automations configured in a pipe.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const res = await client.request(LIST_AUTOMATIONS, { pipeId: p.pipe_id })
          return ok(res.pipe?.automations ?? [])
        }),
    },
    {
      name: 'create_automation',
      description: 'Create an automation rule in a pipe.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        name: z.string().min(1),
        trigger_event: z.string().min(1),
        actions: z.array(
          z.object({
            action_id: z.string().min(1),
            action_fields: z.array(z.object({ field_id: z.string(), field_value: z.string() })),
          }),
        ),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            name: z.string().min(1),
            trigger_event: z.string().min(1),
            actions: z.array(
              z.object({
                action_id: z.string().min(1),
                action_fields: z.array(z.object({ field_id: z.string(), field_value: z.string() })),
              }),
            ),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            sanitizeString(p.name)
            const res = await client.request(CREATE_AUTOMATION, {
              input: {
                pipe_id: p.pipe_id,
                name: p.name,
                trigger_event: p.trigger_event,
                actions: p.actions,
              },
            })
            return ok(res.createAutomation?.automation)
          },
        ),
    },
    {
      name: 'toggle_automation',
      description: 'Enable or disable an automation.',
      inputSchema: z.object({ automation_id: z.string().min(1), active: z.boolean() }),
      handler: (input) =>
        safeHandler(
          z.object({ automation_id: z.string().min(1), active: z.boolean() }),
          input,
          async (p) => {
            sanitizeString(p.automation_id)
            const res = await client.request(TOGGLE_AUTOMATION, {
              input: { id: p.automation_id, active: p.active },
            })
            return ok(res.updateAutomation?.automation)
          },
        ),
    },
    {
      name: 'delete_automation',
      description: 'Delete an automation. Requires confirm: true.',
      inputSchema: z.object({ automation_id: z.string().min(1), confirm: z.literal(true) }),
      handler: (input) =>
        safeHandler(
          z.object({ automation_id: z.string().min(1), confirm: z.literal(true) }),
          input,
          async (p) => {
            sanitizeString(p.automation_id)
            const res = await client.request(DELETE_AUTOMATION, { input: { id: p.automation_id } })
            return ok({ success: res.deleteAutomation?.success })
          },
        ),
    },
    {
      name: 'list_webhooks',
      description: 'List webhooks registered in a pipe.',
      inputSchema: z.object({ pipe_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ pipe_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.pipe_id)
          const res = await client.request(LIST_WEBHOOKS, { pipeId: p.pipe_id })
          return ok(res.pipe?.webhooks ?? [])
        }),
    },
    {
      name: 'create_webhook',
      description: 'Register a webhook on a pipe.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        url: z.string().url(),
        actions: z.array(z.enum(WEBHOOK_ACTIONS)).min(1),
        headers: z.record(z.string()).optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            url: z.string().url(),
            actions: z.array(z.enum(WEBHOOK_ACTIONS)).min(1),
            headers: z.record(z.string()).optional(),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            const res = await client.request(CREATE_WEBHOOK, {
              input: { pipe_id: p.pipe_id, url: p.url, actions: p.actions, headers: p.headers },
            })
            return ok(res.createWebhook?.webhook)
          },
        ),
    },
    {
      name: 'delete_webhook',
      description: 'Delete a webhook. Requires confirm: true.',
      inputSchema: z.object({ webhook_id: z.string().min(1), confirm: z.literal(true) }),
      handler: (input) =>
        safeHandler(
          z.object({ webhook_id: z.string().min(1), confirm: z.literal(true) }),
          input,
          async (p) => {
            sanitizeString(p.webhook_id)
            const res = await client.request(DELETE_WEBHOOK, { input: { id: p.webhook_id } })
            return ok({ success: res.deleteWebhook?.success })
          },
        ),
    },
  ]
}
