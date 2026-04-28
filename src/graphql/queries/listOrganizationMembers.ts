import { gqlDoc } from '../../gql.js'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ListOrganizationMembersQuery, ListOrganizationMembersQueryVariables } from '../../generated/graphql.js'

export const LIST_ORGANIZATION_MEMBERS: TypedDocumentNode<ListOrganizationMembersQuery, ListOrganizationMembersQueryVariables> = gqlDoc(`
  query ListOrganizationMembers($organizationId: ID!) {
    organization(id: $organizationId) {
      members { user { id name email } role_name }
    }
  }
`)
