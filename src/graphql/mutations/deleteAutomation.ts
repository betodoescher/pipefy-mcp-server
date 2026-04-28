import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { DeleteAutomationMutation, DeleteAutomationMutationVariables } from '../../generated/graphql.js'

export const DELETE_AUTOMATION: TypedDocumentNode<DeleteAutomationMutation, DeleteAutomationMutationVariables> = gqlDoc(`
  mutation DeleteAutomation($input: DeleteAutomationInput!) {
    deleteAutomation(input: $input) {
      success
    }
  }
`)
