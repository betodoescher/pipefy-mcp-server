import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { CreatePhaseMutation, CreatePhaseMutationVariables } from '../../generated/graphql.js'

export const CREATE_PHASE: TypedDocumentNode<CreatePhaseMutation, CreatePhaseMutationVariables> = gqlDoc(`
  mutation CreatePhase($input: CreatePhaseInput!) {
    createPhase(input: $input) {
      phase { id name }
    }
  }
`)
