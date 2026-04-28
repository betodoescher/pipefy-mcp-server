import type { PipefyClient } from './pipefyClient.js'
import type { CardNode, ListCardsQuery } from './generated/graphql.js'
import { LIST_CARDS } from './graphql/queries/listCards.js'

export async function fetchAllCards(
  client: PipefyClient,
  pipeId: string,
  maxResults = 500,
  pageSize = 50,
): Promise<{ cards: CardNode[]; truncated: boolean }> {
  const cards: CardNode[] = []
  let cursor: string | null = null

  do {
    const result: ListCardsQuery = await client.request(LIST_CARDS, {
      pipeId,
      first: pageSize,
      after: cursor,
    })
    const edges = result.allCards?.edges ?? []
    for (const edge of edges) {
      if (cards.length >= maxResults) {
        return { cards, truncated: true }
      }
      cards.push(edge.node)
    }
    const pageInfo: ListCardsQuery['allCards']['pageInfo'] = result.allCards?.pageInfo
    cursor = pageInfo?.hasNextPage ? (pageInfo.endCursor ?? null) : null
  } while (cursor !== null)

  return { cards, truncated: false }
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function median(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
