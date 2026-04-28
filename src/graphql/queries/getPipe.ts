import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { GetPipeQuery, GetPipeQueryVariables } from '../../generated/graphql.js'

export const GET_PIPE: TypedDocumentNode<GetPipeQuery, GetPipeQueryVariables> = gqlDoc(`
  query GetPipe($id: ID!) {
    pipe(id: $id) {
      id
      name
      description
      icon
      phases {
        id
        name
        done
        cards_count
        fields { id label type required options }
      }
      start_form_fields { id label type required options }
      members { user { id name email } role_name }
      webhooks { id url actions }
    }
  }
`)
