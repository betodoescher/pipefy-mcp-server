import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { CreateAutomationMutation, CreateAutomationMutationVariables } from '../../generated/graphql.js'

export const CREATE_AUTOMATION: TypedDocumentNode<CreateAutomationMutation, CreateAutomationMutationVariables> = gqlDoc(`
  mutation CreateAutomation($input: CreateAutomationInput!) {
    createAutomation(input: $input) {
      automation { id name }
    }
  }
`)
