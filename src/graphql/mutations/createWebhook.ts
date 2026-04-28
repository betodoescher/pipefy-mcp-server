import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { CreateWebhookMutation, CreateWebhookMutationVariables } from '../../generated/graphql.js'

export const CREATE_WEBHOOK: TypedDocumentNode<CreateWebhookMutation, CreateWebhookMutationVariables> = gqlDoc(`
  mutation CreateWebhook($input: CreateWebhookInput!) {
    createWebhook(input: $input) {
      webhook { id url }
    }
  }
`)
