import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { DeleteCardMutation, DeleteCardMutationVariables } from '../../generated/graphql.js'

export const DELETE_CARD: TypedDocumentNode<DeleteCardMutation, DeleteCardMutationVariables> = gqlDoc(`
  mutation DeleteCard($input: DeleteCardInput!) {
    deleteCard(input: $input) {
      success
    }
  }
`)
