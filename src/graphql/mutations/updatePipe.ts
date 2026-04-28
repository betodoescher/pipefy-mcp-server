import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UpdatePipeMutation, UpdatePipeMutationVariables } from '../../generated/graphql.js'

export const UPDATE_PIPE: TypedDocumentNode<UpdatePipeMutation, UpdatePipeMutationVariables> = gqlDoc(`
  mutation UpdatePipe($input: UpdatePipeInput!) {
    updatePipe(input: $input) {
      pipe { id name }
    }
  }
`)
