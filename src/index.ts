import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { config } from './config.js'
import { PipefyClient } from './pipefyClient.js'
import { cardTools } from './tools/cards.js'
import { searchTools } from './tools/search.js'
import { pipeTools } from './tools/pipes.js'
import { fieldTools } from './tools/fields.js'
import { metricsTools } from './tools/metrics.js'
import { slaTools } from './tools/sla.js'
import { automationTools } from './tools/automations.js'
import { organizationTools } from './tools/organization.js'
import { reportTools } from './tools/reports.js'
import type { ToolDefinition } from './utils.js'

const client = new PipefyClient(config)

const allTools: ToolDefinition[] = [
  ...cardTools(client),
  ...searchTools(client, config),
  ...pipeTools(client),
  ...fieldTools(client),
  ...metricsTools(client, config),
  ...slaTools(client, config),
  ...automationTools(client),
  ...organizationTools(client),
  ...reportTools(client, config),
]

const server = new Server(
  { name: 'mcp-pipefy', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema) as Record<string, unknown>,
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const tool = allTools.find((t) => t.name === request.params.name)
  if (!tool) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Tool not found', name: request.params.name }) }],
      isError: true,
    }
  }
  return tool.handler(request.params.arguments)
})

const transport = new StdioServerTransport()
await server.connect(transport)
