import { GraphQLClient, ClientError } from 'graphql-request'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { Config } from './config.js'

export class PipefyClientError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'PipefyClientError'
  }
}

export class PipefyClient {
  private readonly client: GraphQLClient

  constructor(config: Config) {
    this.client = new GraphQLClient(config.PIPEFY_API_URL, {
      headers: { Authorization: `Bearer ${config.PIPEFY_TOKEN}` },
    })
  }

  async request<TData, TVariables>(
    document: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
  ): Promise<TData> {
    try {
      return await this.client.request(document, variables as Record<string, unknown>)
    } catch (err) {
      if (err instanceof ClientError) {
        const status = err.response.status ?? 500
        const message =
          (err.response.errors?.[0]?.message) ?? err.message ?? 'Unknown Pipefy API error'
        throw new PipefyClientError(status, message)
      }
      throw err
    }
  }
}
