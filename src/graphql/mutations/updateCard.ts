import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UpdateCardMutation, UpdateCardMutationVariables } from '../../generated/graphql.js'

export const UPDATE_CARD: TypedDocumentNode<UpdateCardMutation, UpdateCardMutationVariables> = gqlDoc(`
  mutation UpdateCard($input: UpdateCardInput!) {
    updateCard(input: $input) {
      card { id title }
    }
  }
`)
