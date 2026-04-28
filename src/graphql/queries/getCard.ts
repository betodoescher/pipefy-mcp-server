import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { GetCardQuery, GetCardQueryVariables } from '../../generated/graphql.js'

export const GET_CARD: TypedDocumentNode<GetCardQuery, GetCardQueryVariables> = gqlDoc(`
  query GetCard($id: ID!) {
    card(id: $id) {
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
      comments_count
      phase_history {
        phase { id name done }
        firstTimeIn
        lastTimeOut
        duration
      }
    }
  }
`)
