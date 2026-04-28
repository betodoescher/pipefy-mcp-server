import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { RemoveMemberMutation, RemoveMemberMutationVariables } from '../../generated/graphql.js'

export const REMOVE_MEMBER_FROM_PIPE: TypedDocumentNode<RemoveMemberMutation, RemoveMemberMutationVariables> = gqlDoc(`
  mutation RemoveMember($input: DestroyPipeMemberInput!) {
    destroyPipeMember(input: $input) {
      success
    }
  }
`)
