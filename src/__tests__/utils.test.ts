import { describe, it, expect } from 'vitest'
import { sanitizeString, ValidationError, safeHandler } from '../utils.js'
import { z } from 'zod'

// Property 14: Injection patterns are rejected
describe('sanitizeString — Property 14', () => {
  const injectionPatterns = [
    '${evil}',
    '__schema { types }',
    '__type(name: "Query")',
    'fragment Foo on Bar { id }',
  ]

  for (const pattern of injectionPatterns) {
    it(`rejects: ${pattern}`, () => {
      expect(() => sanitizeString(pattern)).toThrow(ValidationError)
    })
  }

  it('accepts clean strings', () => {
    expect(sanitizeString('  hello world  ')).toBe('hello world')
    expect(sanitizeString('pipe-123')).toBe('pipe-123')
  })
})

// Property 13: Validation errors identify the invalid field
describe('safeHandler — Property 13', () => {
  const schema = z.object({ pipe_id: z.string().min(1), count: z.number() })

  it('returns isError:true with field path when validation fails', async () => {
    const result = await safeHandler(schema, { pipe_id: '', count: 5 }, async () => ({
      content: [{ type: 'text' as const, text: 'ok' }],
    }))
    expect(result.isError).toBe(true)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.error).toBe('ValidationError')
    expect(parsed.field).toBeTruthy()
  })

  it('returns isError:true when required field is missing', async () => {
    const result = await safeHandler(schema, { count: 5 }, async () => ({
      content: [{ type: 'text' as const, text: 'ok' }],
    }))
    expect(result.isError).toBe(true)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.field).toBe('pipe_id')
  })

  it('calls fn when input is valid', async () => {
    const result = await safeHandler(schema, { pipe_id: 'abc', count: 1 }, async () => ({
      content: [{ type: 'text' as const, text: 'success' }],
    }))
    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBe('success')
  })
})
