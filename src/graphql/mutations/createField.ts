import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { CreateFieldMutation, CreateFieldMutationVariables } from '../../generated/graphql.js'

export const CREATE_FIELD: TypedDocumentNode<CreateFieldMutation, CreateFieldMutationVariables> = gqlDoc(`
  mutation CreateField($input: CreateFieldInput!) {
    createField(input: $input) {
      field { id label type }
    }
  }
`)
