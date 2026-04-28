import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { MoveCardToPhaseMutation, MoveCardToPhaseMutationVariables } from '../../generated/graphql.js'

export const MOVE_CARD_TO_PHASE: TypedDocumentNode<MoveCardToPhaseMutation, MoveCardToPhaseMutationVariables> = gqlDoc(`
  mutation MoveCardToPhase($input: MoveCardToPhaseInput!) {
    moveCardToPhase(input: $input) {
      card { id current_phase { id name } }
    }
  }
`)
