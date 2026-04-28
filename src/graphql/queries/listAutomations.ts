import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ListAutomationsQuery, ListAutomationsQueryVariables } from '../../generated/graphql.js'

export const LIST_AUTOMATIONS: TypedDocumentNode<ListAutomationsQuery, ListAutomationsQueryVariables> = gqlDoc(`
  query ListAutomations($pipeId: ID!) {
    pipe(id: $pipeId) {
      automations { id name active }
    }
  }
`)
