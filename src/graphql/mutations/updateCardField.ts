import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UpdateCardFieldMutation, UpdateCardFieldMutationVariables } from '../../generated/graphql.js'

export const UPDATE_CARD_FIELD: TypedDocumentNode<UpdateCardFieldMutation, UpdateCardFieldMutationVariables> = gqlDoc(`
  mutation UpdateCardField($input: UpdateCardFieldInput!) {
    updateCardField(input: $input) {
      card { id }
    }
  }
`)
