import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { CreateCardMutation, CreateCardMutationVariables } from '../../generated/graphql.js'

export const CREATE_CARD: TypedDocumentNode<CreateCardMutation, CreateCardMutationVariables> = gqlDoc(`
  mutation CreateCard($input: CreateCardInput!) {
    createCard(input: $input) {
      card { id title url }
    }
  }
`)
