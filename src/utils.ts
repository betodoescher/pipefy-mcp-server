import { ZodError, ZodSchema } from 'zod'
import { PipefyClientError } from './pipefyClient.js'

export interface ToolResult {
  [key: string]: unknown
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: ZodSchema
  handler: (input: unknown) => Promise<ToolResult>
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

const INJECTION_PATTERNS = [
  /\$\{/,
  /__schema/i,
  /__type/i,
  /fragment\s+\w+\s+on/i,
]

export function sanitizeString(value: string): string {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      throw new ValidationError(`Input contains disallowed pattern`)
    }
  }
  return value.trim()
}

export function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

export function safeHandler<T>(
  schema: ZodSchema<T>,
  input: unknown,
  fn: (parsed: T) => Promise<ToolResult>,
): Promise<ToolResult> {
  return (async () => {
    try {
      const parsed = schema.parse(input)
      return await fn(parsed)
    } catch (err) {
      if (err instanceof ZodError) {
        const field = err.issues[0]?.path.join('.') ?? 'unknown'
        const message = err.issues[0]?.message ?? 'Validation failed'
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'ValidationError', field, message }) }],
          isError: true,
        }
      }
      if (err instanceof ValidationError) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'ValidationError', message: err.message }) }],
          isError: true,
        }
      }
      if (err instanceof PipefyClientError) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'PipefyClientError', statusCode: err.statusCode, message: err.message }) }],
          isError: true,
        }
      }
      const message = err instanceof Error ? err.message : 'Unexpected error'
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'UnexpectedError', message }) }],
        isError: true,
      }
    }
  })()
}
