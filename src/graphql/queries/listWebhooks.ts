import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ListWebhooksQuery, ListWebhooksQueryVariables } from '../../generated/graphql.js'

export const LIST_WEBHOOKS: TypedDocumentNode<ListWebhooksQuery, ListWebhooksQueryVariables> = gqlDoc(`
  query ListWebhooks($pipeId: ID!) {
    pipe(id: $pipeId) {
      webhooks { id url actions }
    }
  }
`)
