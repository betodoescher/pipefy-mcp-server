import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cardTools } from '../tools/cards.js'
import { automationTools } from '../tools/automations.js'
import type { PipefyClient } from '../pipefyClient.js'

// Minimal mock client — tests only validate input guards, no real API calls
function mockClient(): PipefyClient {
  return {
    request: vi.fn().mockResolvedValue({}),
  } as unknown as PipefyClient
}

// Task 8.1 — Unit tests for card tools
describe('delete_card guard — Task 8.1', () => {
  let client: PipefyClient
  let tools: ReturnType<typeof cardTools>

  beforeEach(() => {
    client = mockClient()
    tools = cardTools(client)
  })

  it('returns isError:true when confirm is missing', async () => {
    const tool = tools.find((t) => t.name === 'delete_card')!
    const result = await tool.handler({ card_id: '123' })
    expect(result.isError).toBe(true)
  })

  it('returns isError:true when confirm is false', async () => {
    const tool = tools.find((t) => t.name === 'delete_card')!
    const result = await tool.handler({ card_id: '123', confirm: false })
    expect(result.isError).toBe(true)
  })

  it('returns isError:true when pipe_id is missing from create_card', async () => {
    const tool = tools.find((t) => t.name === 'create_card')!
    const result = await tool.handler({ title: 'My Card' })
    expect(result.isError).toBe(true)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.error).toBe('ValidationError')
    expect(parsed.field).toBe('pipe_id')
  })
})

// Task 14.1 — Unit tests for delete guards
describe('delete_automation / delete_webhook guards — Task 14.1', () => {
  let client: PipefyClient
  let tools: ReturnType<typeof automationTools>

  beforeEach(() => {
    client = mockClient()
    tools = automationTools(client)
  })

  it('delete_automation returns isError:true without confirm', async () => {
    const tool = tools.find((t) => t.name === 'delete_automation')!
    const result = await tool.handler({ automation_id: 'auto-1' })
    expect(result.isError).toBe(true)
  })

  it('delete_webhook returns isError:true without confirm', async () => {
    const tool = tools.find((t) => t.name === 'delete_webhook')!
    const result = await tool.handler({ webhook_id: 'wh-1' })
    expect(result.isError).toBe(true)
  })
})
