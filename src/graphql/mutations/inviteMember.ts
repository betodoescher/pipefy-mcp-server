import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { InviteMemberMutation, InviteMemberMutationVariables } from '../../generated/graphql.js'

export const INVITE_MEMBER_TO_PIPE: TypedDocumentNode<InviteMemberMutation, InviteMemberMutationVariables> = gqlDoc(`
  mutation InviteMember($input: CreatePipeMemberInput!) {
    createPipeMember(input: $input) {
      pipe_member { user { id name } }
    }
  }
`)
