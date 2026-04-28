import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { CreateChildCardMutation, CreateChildCardMutationVariables } from '../../generated/graphql.js'

export const CREATE_CHILD_CARD: TypedDocumentNode<CreateChildCardMutation, CreateChildCardMutationVariables> = gqlDoc(`
  mutation CreateChildCard($input: CreateCardInput!) {
    createCard(input: $input) {
      card { id title }
    }
  }
`)
