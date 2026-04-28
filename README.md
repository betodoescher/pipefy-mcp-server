# MCP Pipefy Server

MCP Server genérico para integração com a API GraphQL do Pipefy. Permite que assistentes de IA (Claude, Kiro, etc.) gerenciem cards, pipes, campos, métricas, SLA, automações e webhooks em qualquer pipe da organização.

## Pré-requisitos

- Node.js 20+
- Token de acesso pessoal do Pipefy

## Instalação

```bash
npm install
```

## Configuração

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```

2. Preencha as variáveis no `.env`:
   ```
   PIPEFY_TOKEN=seu_token_aqui
   PIPEFY_ORG_ID=id_da_sua_org
   ```

### Como obter o `PIPEFY_TOKEN`

Acesse **Pipefy → Perfil → Personal access tokens** e gere um novo token com os escopos necessários.

### Como encontrar o `PIPEFY_ORG_ID`

Execute a query abaixo com seu token:

```bash
curl -X POST https://api.pipefy.com/graphql \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ me { organizations { id name } } }"}'
```

## Gerar tipos TypeScript (opcional, após mudanças no schema)

```bash
npm run codegen
```

> Requer `PIPEFY_TOKEN` no ambiente. O arquivo `src/generated/graphql.ts` já está incluído no repositório.

## Build

```bash
npm run build
```

Gera `dist/index.js`.

## Configuração no cliente MCP

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "pipefy": {
      "command": "node",
      "args": ["/caminho/para/MCP-pipefy/dist/index.js"],
      "env": {
        "PIPEFY_TOKEN": "seu_token",
        "PIPEFY_ORG_ID": "seu_org_id"
      }
    }
  }
}
```

### Kiro (`.kiro/settings/mcp.json`)

```json
{
  "mcpServers": {
    "pipefy": {
      "command": "node",
      "args": ["/caminho/para/MCP-pipefy/dist/index.js"],
      "env": {
        "PIPEFY_TOKEN": "seu_token",
        "PIPEFY_ORG_ID": "seu_org_id"
      }
    }
  }
}
```

## Tools disponíveis

### Cards
| Tool | Descrição |
|------|-----------|
| `create_card` | Cria um card em um pipe |
| `get_card` | Busca detalhes completos de um card |
| `update_card` | Atualiza título, due date, assignees ou labels |
| `update_card_field` | Atualiza um campo específico |
| `move_card_to_phase` | Move card para outra fase |
| `delete_card` | Deleta card (requer `confirm: true`) |
| `add_comment_to_card` | Adiciona comentário |
| `get_card_comments` | Lista comentários |
| `assign_card` | Atribui/remove usuários |
| `create_child_card` | Cria card filho |
| `get_card_children` | Lista cards filhos |

### Busca & Filtros
| Tool | Descrição |
|------|-----------|
| `list_cards` | Lista cards com filtros e paginação automática |
| `search_cards_by_field` | Busca por valor de campo |
| `get_overdue_cards` | Cards com due date vencida |
| `get_unassigned_cards` | Cards sem responsável |
| `get_stale_cards` | Cards parados há N dias |

### Pipes & Fases
| Tool | Descrição |
|------|-----------|
| `list_pipes` | Lista pipes da organização |
| `get_pipe` | Detalhes completos de um pipe |
| `get_pipe_phases` | Fases com contagem de cards |
| `create_pipe` | Cria novo pipe |
| `clone_pipe` | Clona estrutura de um pipe |
| `update_pipe` | Atualiza nome/ícone |
| `create_phase` | Cria nova fase |
| `update_phase` | Atualiza fase |

### Campos
| Tool | Descrição |
|------|-----------|
| `list_pipe_fields` | Campos do formulário inicial |
| `list_phase_fields` | Campos de uma fase |
| `create_field` | Cria campo |
| `update_field` | Atualiza campo |
| `create_conditional_field` | Cria campo condicional |

### Métricas
| Tool | Descrição |
|------|-----------|
| `get_cycle_time` | Tempo médio por fase (avg, median, p75, p95) |
| `get_lead_time` | Tempo total criação → conclusão |
| `get_throughput` | Cards concluídos por semana/mês |
| `get_phase_distribution` | Snapshot de cards por fase |
| `get_creation_vs_completion` | Criados vs concluídos por período |
| `get_bottlenecks` | Fases com maior tempo médio |

### SLA
| Tool | Descrição |
|------|-----------|
| `get_sla_status` | Status SLA de todos os cards ativos |
| `get_sla_violations` | Cards com SLA violado |
| `get_sla_forecast` | Cards que vencerão nas próximas N horas |
| `get_sla_compliance_history` | Histórico de compliance % |

### Automações & Webhooks
| Tool | Descrição |
|------|-----------|
| `list_automations` | Lista automações |
| `create_automation` | Cria automação |
| `toggle_automation` | Ativa/desativa automação |
| `delete_automation` | Deleta automação (requer `confirm: true`) |
| `list_webhooks` | Lista webhooks |
| `create_webhook` | Registra webhook |
| `delete_webhook` | Deleta webhook (requer `confirm: true`) |

### Organização
| Tool | Descrição |
|------|-----------|
| `get_organization` | Dados da organização |
| `list_organization_members` | Membros da organização |
| `list_pipe_members` | Membros de um pipe |
| `invite_member_to_pipe` | Convida membro |
| `remove_member_from_pipe` | Remove membro |

### Relatórios
| Tool | Descrição |
|------|-----------|
| `get_portfolio_report` | Relatório consolidado de todos os pipes |
| `get_pipe_report` | Relatório completo de um pipe |
| `get_assignee_workload` | Distribuição de carga por responsável |

## Fluxo típico

```
1. list_pipes          → descobre os pipes disponíveis
2. get_pipe_phases     → vê as fases do pipe escolhido
3. list_pipe_fields    → vê os campos do formulário
4. create_card         → cria card com campos preenchidos
5. update_card_field   → atualiza um campo específico
6. move_card_to_phase  → avança o card para a próxima fase
7. get_pipe_report     → verifica métricas do pipe
```

## Atualizar tipos após mudança no schema

Sempre que o schema do Pipefy mudar (novos campos, tipos, etc.), rode:

```bash
npm run codegen
```

Isso regenera `src/generated/graphql.ts` e depois faça um novo build:

```bash
npm run build
```
