import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { GetOrganizationQuery, GetOrganizationQueryVariables } from '../../generated/graphql.js'

export const GET_ORGANIZATION: TypedDocumentNode<GetOrganizationQuery, GetOrganizationQueryVariables> = gqlDoc(`
  query GetOrganization($id: ID!) {
    organization(id: $id) {
      id
      name
      members { user { id name email } role_name }
      pipes { id name }
    }
  }
`)
