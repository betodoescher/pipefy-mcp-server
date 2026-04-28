import { parse } from 'graphql'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'

// Parses a GraphQL document string into a TypedDocumentNode.
// This is the correct way to create typed document nodes without codegen.
export function gqlDoc<TData, TVariables>(source: string): TypedDocumentNode<TData, TVariables> {
  return parse(source) as unknown as TypedDocumentNode<TData, TVariables>
}
