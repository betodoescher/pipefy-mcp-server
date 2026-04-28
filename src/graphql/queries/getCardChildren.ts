import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { GetCardChildrenQuery, GetCardChildrenQueryVariables } from '../../generated/graphql.js'

export const GET_CARD_CHILDREN: TypedDocumentNode<GetCardChildrenQuery, GetCardChildrenQueryVariables> = gqlDoc(`
  query GetCardChildren($id: ID!) {
    card(id: $id) {
      child_relations {
        cards {
          id
          title
          current_phase { id name }
        }
      }
    }
  }
`)
