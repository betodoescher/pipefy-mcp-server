import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UpdateFieldMutation, UpdateFieldMutationVariables } from '../../generated/graphql.js'

export const UPDATE_FIELD: TypedDocumentNode<UpdateFieldMutation, UpdateFieldMutationVariables> = gqlDoc(`
  mutation UpdateField($input: UpdateFieldInput!) {
    updateField(input: $input) {
      field { id label }
    }
  }
`)
