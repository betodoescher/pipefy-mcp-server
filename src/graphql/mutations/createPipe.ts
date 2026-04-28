import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { CreatePipeMutation, CreatePipeMutationVariables } from '../../generated/graphql.js'

export const CREATE_PIPE: TypedDocumentNode<CreatePipeMutation, CreatePipeMutationVariables> = gqlDoc(`
  mutation CreatePipe($input: CreatePipeInput!) {
    createPipe(input: $input) {
      pipe { id name }
    }
  }
`)
