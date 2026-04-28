import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ListCardsQuery, ListCardsQueryVariables } from '../../generated/graphql.js'

export const LIST_CARDS: TypedDocumentNode<ListCardsQuery, ListCardsQueryVariables> = gqlDoc(`
  query ListCards($pipeId: ID!, $first: Int, $after: String, $filter: CardsTableFilter) {
    allCards(pipeId: $pipeId, first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          title
          current_phase { id name }
          fields { field { id label type } value array_value }
          assignees { id name email }
          due_date
          labels { id name color }
          created_at
          updated_at
          finished_at
          phase_history {
            phase { id name done }
            firstTimeIn
            lastTimeOut
            duration
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`)
