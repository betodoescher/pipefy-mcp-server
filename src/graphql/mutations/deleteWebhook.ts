import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { DeleteWebhookMutation, DeleteWebhookMutationVariables } from '../../generated/graphql.js'

export const DELETE_WEBHOOK: TypedDocumentNode<DeleteWebhookMutation, DeleteWebhookMutationVariables> = gqlDoc(`
  mutation DeleteWebhook($input: DeleteWebhookInput!) {
    deleteWebhook(input: $input) {
      success
    }
  }
`)
