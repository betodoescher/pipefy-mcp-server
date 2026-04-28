import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ToggleAutomationMutation, ToggleAutomationMutationVariables } from '../../generated/graphql.js'

export const TOGGLE_AUTOMATION: TypedDocumentNode<ToggleAutomationMutation, ToggleAutomationMutationVariables> = gqlDoc(`
  mutation ToggleAutomation($input: UpdateAutomationInput!) {
    updateAutomation(input: $input) {
      automation { id active }
    }
  }
`)
