import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { GetCardCommentsQuery, GetCardCommentsQueryVariables } from '../../generated/graphql.js'

export const GET_CARD_COMMENTS: TypedDocumentNode<GetCardCommentsQuery, GetCardCommentsQueryVariables> = gqlDoc(`
  query GetCardComments($id: ID!) {
    card(id: $id) {
      comments {
        id
        text
        created_at
        author { id name email }
      }
    }
  }
`)
