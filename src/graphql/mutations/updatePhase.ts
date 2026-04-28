import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UpdatePhaseMutation, UpdatePhaseMutationVariables } from '../../generated/graphql.js'

export const UPDATE_PHASE: TypedDocumentNode<UpdatePhaseMutation, UpdatePhaseMutationVariables> = gqlDoc(`
  mutation UpdatePhase($input: UpdatePhaseInput!) {
    updatePhase(input: $input) {
      phase { id name }
    }
  }
`)
