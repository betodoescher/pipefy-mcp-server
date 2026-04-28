import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ListPipeMembersQuery, ListPipeMembersQueryVariables } from '../../generated/graphql.js'

export const LIST_PIPE_MEMBERS: TypedDocumentNode<ListPipeMembersQuery, ListPipeMembersQueryVariables> = gqlDoc(`
  query ListPipeMembers($pipeId: ID!) {
    pipe(id: $pipeId) {
      members { user { id name email } role_name }
    }
  }
`)
