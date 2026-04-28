import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { CreateCommentMutation, CreateCommentMutationVariables } from '../../generated/graphql.js'

export const CREATE_COMMENT: TypedDocumentNode<CreateCommentMutation, CreateCommentMutationVariables> = gqlDoc(`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      comment { id text }
    }
  }
`)
