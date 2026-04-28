import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ListPipesQuery, ListPipesQueryVariables } from '../../generated/graphql.js'

export const LIST_PIPES: TypedDocumentNode<ListPipesQuery, ListPipesQueryVariables> = gqlDoc(`
  query ListPipes($organizationId: ID!) {
    organization(id: $organizationId) {
      pipes {
        id
        name
        description
        phases { id name cards_count }
      }
    }
  }
`)
