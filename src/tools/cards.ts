import { z } from 'zod'
import type { PipefyClient } from '../pipefyClient.js'
import { safeHandler, sanitizeString, ok, type ToolDefinition } from '../utils.js'
import { GET_CARD } from '../graphql/queries/getCard.js'
import { GET_CARD_COMMENTS } from '../graphql/queries/getCardComments.js'
import { GET_CARD_CHILDREN } from '../graphql/queries/getCardChildren.js'
import { CREATE_CARD } from '../graphql/mutations/createCard.js'
import { UPDATE_CARD } from '../graphql/mutations/updateCard.js'
import { UPDATE_CARD_FIELD } from '../graphql/mutations/updateCardField.js'
import { MOVE_CARD_TO_PHASE } from '../graphql/mutations/moveCardToPhase.js'
import { DELETE_CARD } from '../graphql/mutations/deleteCard.js'
import { CREATE_COMMENT } from '../graphql/mutations/createComment.js'
import { CREATE_CHILD_CARD } from '../graphql/mutations/createChildCard.js'

const FieldAttr = z.object({ field_id: z.string().min(1), field_value: z.string() })

export function cardTools(client: PipefyClient): ToolDefinition[] {
  return [
    {
      name: 'create_card',
      description: 'Create a card in a pipe. Returns the created card id and title.',
      inputSchema: z.object({
        pipe_id: z.string().min(1),
        phase_id: z.string().optional(),
        title: z.string().min(1).max(500).transform((s) => s.trim()),
        assignee_ids: z.array(z.string()).optional(),
        due_date: z.string().optional(),
        fields_attributes: z.array(FieldAttr).optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            pipe_id: z.string().min(1),
            phase_id: z.string().optional(),
            title: z.string().min(1).max(500).transform((s) => s.trim()),
            assignee_ids: z.array(z.string()).optional(),
            due_date: z.string().optional(),
            fields_attributes: z.array(FieldAttr).optional(),
          }),
          input,
          async (p) => {
            sanitizeString(p.pipe_id)
            sanitizeString(p.title)
            const res = await client.request(CREATE_CARD, {
              input: {
                pipe_id: p.pipe_id,
                phase_id: p.phase_id,
                title: p.title,
                assignee_ids: p.assignee_ids,
                due_date: p.due_date,
                fields_attributes: p.fields_attributes,
              },
            })
            return ok(res.createCard?.card)
          },
        ),
    },
    {
      name: 'get_card',
      description: 'Get full details of a card by ID.',
      inputSchema: z.object({ card_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ card_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.card_id)
          const res = await client.request(GET_CARD, { id: p.card_id })
          return ok(res.card)
        }),
    },
    {
      name: 'update_card',
      description: 'Update title, due date, assignees or labels of a card.',
      inputSchema: z.object({
        card_id: z.string().min(1),
        title: z.string().optional(),
        due_date: z.string().optional(),
        assignee_ids: z.array(z.string()).optional(),
        label_ids: z.array(z.string()).optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            card_id: z.string().min(1),
            title: z.string().optional(),
            due_date: z.string().optional(),
            assignee_ids: z.array(z.string()).optional(),
            label_ids: z.array(z.string()).optional(),
          }),
          input,
          async (p) => {
            sanitizeString(p.card_id)
            const res = await client.request(UPDATE_CARD, {
              input: {
                id: p.card_id,
                title: p.title,
                due_date: p.due_date,
                assignee_ids: p.assignee_ids,
                label_ids: p.label_ids,
              },
            })
            return ok(res.updateCard?.card)
          },
        ),
    },
    {
      name: 'update_card_field',
      description: 'Update a single field value on a card.',
      inputSchema: z.object({
        card_id: z.string().min(1),
        field_id: z.string().min(1),
        new_value: z.string(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ card_id: z.string().min(1), field_id: z.string().min(1), new_value: z.string() }),
          input,
          async (p) => {
            sanitizeString(p.card_id)
            sanitizeString(p.field_id)
            const res = await client.request(UPDATE_CARD_FIELD, {
              input: { card_id: p.card_id, field_id: p.field_id, new_value: p.new_value },
            })
            return ok(res.updateCardField?.card)
          },
        ),
    },
    {
      name: 'move_card_to_phase',
      description: 'Move a card to a different phase.',
      inputSchema: z.object({ card_id: z.string().min(1), destination_phase_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(
          z.object({ card_id: z.string().min(1), destination_phase_id: z.string().min(1) }),
          input,
          async (p) => {
            sanitizeString(p.card_id)
            sanitizeString(p.destination_phase_id)
            const res = await client.request(MOVE_CARD_TO_PHASE, {
              input: { card_id: p.card_id, destination_phase_id: p.destination_phase_id },
            })
            return ok(res.moveCardToPhase?.card)
          },
        ),
    },
    {
      name: 'delete_card',
      description: 'Delete a card. Requires confirm: true.',
      inputSchema: z.object({ card_id: z.string().min(1), confirm: z.literal(true) }),
      handler: (input) =>
        safeHandler(
          z.object({ card_id: z.string().min(1), confirm: z.literal(true) }),
          input,
          async (p) => {
            sanitizeString(p.card_id)
            const res = await client.request(DELETE_CARD, { input: { id: p.card_id } })
            return ok({ success: res.deleteCard?.success })
          },
        ),
    },
    {
      name: 'add_comment_to_card',
      description: 'Add a comment to a card.',
      inputSchema: z.object({ card_id: z.string().min(1), text: z.string().min(1) }),
      handler: (input) =>
        safeHandler(
          z.object({ card_id: z.string().min(1), text: z.string().min(1) }),
          input,
          async (p) => {
            sanitizeString(p.card_id)
            const res = await client.request(CREATE_COMMENT, {
              input: { card_id: p.card_id, text: p.text },
            })
            return ok(res.createComment?.comment)
          },
        ),
    },
    {
      name: 'get_card_comments',
      description: 'List comments on a card with author and timestamp.',
      inputSchema: z.object({ card_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ card_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.card_id)
          const res = await client.request(GET_CARD_COMMENTS, { id: p.card_id })
          return ok(res.card?.comments ?? [])
        }),
    },
    {
      name: 'assign_card',
      description: 'Assign or unassign users on a card.',
      inputSchema: z.object({
        card_id: z.string().min(1),
        assignee_ids: z.array(z.string().min(1)),
      }),
      handler: (input) =>
        safeHandler(
          z.object({ card_id: z.string().min(1), assignee_ids: z.array(z.string().min(1)) }),
          input,
          async (p) => {
            sanitizeString(p.card_id)
            const res = await client.request(UPDATE_CARD, {
              input: { id: p.card_id, assignee_ids: p.assignee_ids },
            })
            return ok(res.updateCard?.card)
          },
        ),
    },
    {
      name: 'create_child_card',
      description: 'Create a child card linked to a parent card.',
      inputSchema: z.object({
        parent_id: z.string().min(1),
        pipe_id: z.string().min(1),
        title: z.string().min(1).max(500),
        fields_attributes: z.array(FieldAttr).optional(),
      }),
      handler: (input) =>
        safeHandler(
          z.object({
            parent_id: z.string().min(1),
            pipe_id: z.string().min(1),
            title: z.string().min(1).max(500),
            fields_attributes: z.array(FieldAttr).optional(),
          }),
          input,
          async (p) => {
            sanitizeString(p.parent_id)
            sanitizeString(p.pipe_id)
            const res = await client.request(CREATE_CHILD_CARD, {
              input: {
                parent_id: p.parent_id,
                pipe_id: p.pipe_id,
                title: p.title,
                fields_attributes: p.fields_attributes,
              },
            })
            return ok(res.createCard?.card)
          },
        ),
    },
    {
      name: 'get_card_children',
      description: 'List child cards of a parent card.',
      inputSchema: z.object({ card_id: z.string().min(1) }),
      handler: (input) =>
        safeHandler(z.object({ card_id: z.string().min(1) }), input, async (p) => {
          sanitizeString(p.card_id)
          const res = await client.request(GET_CARD_CHILDREN, { id: p.card_id })
          const children = res.card?.child_relations.flatMap((r) => r.cards) ?? []
          return ok(children)
        }),
    },
  ]
}
