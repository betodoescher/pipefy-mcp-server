import { z } from 'zod'

const envSchema = z.object({
  PIPEFY_TOKEN: z.string().min(1, 'PIPEFY_TOKEN is required and must not be empty'),
  PIPEFY_ORG_ID: z.string().min(1, 'PIPEFY_ORG_ID is required and must not be empty'),
  PIPEFY_API_URL: z.string().url().default('https://api.pipefy.com/graphql'),
  LOG_LEVEL: z.string().default('info'),
  PIPEFY_PAGE_SIZE: z.coerce.number().default(50),
  PIPEFY_STALE_CARD_DAYS: z.coerce.number().default(5),
  PIPEFY_SLA_FORECAST_HOURS: z.coerce.number().default(24),
})

export type Config = z.infer<typeof envSchema>

function loadConfig(): Config {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.') || i.message).join(', ')
    process.stderr.write(`[MCP-Pipefy] Configuration error: ${missing}\n`)
    process.exit(1)
  }
  return result.data
}

export const config = loadConfig()
