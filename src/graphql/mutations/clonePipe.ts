import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ClonePipeMutation, ClonePipeMutationVariables } from '../../generated/graphql.js'

export const CLONE_PIPE: TypedDocumentNode<ClonePipeMutation, ClonePipeMutationVariables> = gqlDoc(`
  mutation ClonePipe($input: ClonePipeInput!) {
    clonePipe(input: $input) {
      pipe { id name }
    }
  }
`)
