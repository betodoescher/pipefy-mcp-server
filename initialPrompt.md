# Pipefy MCP Server

## Contexto
Crie um MCP Server completo para integração com Pipefy no diretório `#Pipefy`.

A API do Pipefy é **GraphQL**, não REST. Endpoint único: `https://api.pipefy.com/graphql`.
A autenticação é via Bearer Token no header `Authorization: Bearer `.

O Pipefy é usado em múltiplas áreas da empresa (desenvolvimento, RH, financeiro, suporte e outras). O MCP deve ser genérico o suficiente para operar em qualquer pipe, sem assumir estrutura de campos específica.

**Nota de design:** como a API é GraphQL, cada tool MCP corresponde a uma query ou mutation específica. As queries e mutations devem ser definidas como constantes tipadas no código, não construídas dinamicamente como strings.

---

## Stack e Requisitos Técnicos

- **Runtime:** Node.js 20+ com TypeScript (strict mode)
- **MCP SDK:** `@modelcontextprotocol/sdk` (versão mais recente)
- **GraphQL Client:** `graphql-request` — leve, sem cache desnecessário, ideal para MCP
- **Code Generation:** `@graphql-codegen/cli` + `@graphql-codegen/typescript` + `@graphql-codegen/typescript-graphql-request` para gerar tipos TypeScript automaticamente a partir do schema do Pipefy
- **Validação:** `zod` para todos os schemas de input das tools
- **Qualidade:** ESLint + Prettier configurados
- **Build:** `tsup` para bundling

---

## Segurança (crítico)

1. O token jamais deve estar hardcoded — ler **apenas** via variável de ambiente `PIPEFY_TOKEN`
2. Criar `.env.example` com todas as variáveis documentadas
3. Adicionar `.env` e `*.env` no `.gitignore`
4. Módulo `config.ts` centralizado com `zod` que valida todas as envs na inicialização — falha com mensagem clara se ausente
5. Nunca logar o valor do token, nem parcialmente
6. Sanitizar todos os inputs antes de incluir nas variáveis GraphQL
7. Operações destrutivas (deleteCard, deletePipe, deleteWebhook) devem exigir `confirm: true` explícito no input

---

## Estrutura de Diretórios

```
Pipefy/
├── src/
│   ├── index.ts                # entrypoint MCP
│   ├── config.ts               # validação de envs com zod
│   ├── pipefyClient.ts         # cliente graphql-request com auth
│   ├── tools/
│   │   ├── cards.ts            # CRUD de cards e campos
│   │   ├── search.ts           # busca e filtros avançados
│   │   ├── pipes.ts            # gestão de pipes e fases
│   │   ├── fields.ts           # campos e formulários
│   │   ├── metrics.ts          # cycle time, lead time, throughput
│   │   ├── sla.ts              # SLA tracking, alertas, gargalos
│   │   ├── automations.ts      # automações e webhooks
│   │   ├── organization.ts     # org, membros, relatório consolidado
│   │   └── reports.ts          # relatórios e rankings de pipes
│   ├── graphql/
│   │   ├── queries/
│   │   │   ├── cards.graphql
│   │   │   ├── pipes.graphql
│   │   │   ├── organization.graphql
│   │   │   └── metrics.graphql
│   │   └── mutations/
│   │       ├── cards.graphql
│   │       ├── pipes.graphql
│   │       ├── fields.graphql
│   │       └── webhooks.graphql
│   ├── generated/
│   │   └── graphql.ts          # tipos gerados pelo codegen — nunca editar manualmente
│   └── types/
│       └── pipefy.ts           # tipos auxiliares não gerados
├── codegen.ts                  # configuração do graphql-codegen
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

---

## Configuração do GraphQL Codegen

Criar `codegen.ts` na raiz com a seguinte configuração:

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: {
    'https://api.pipefy.com/graphql': {
      headers: {
        Authorization: `Bearer ${process.env.PIPEFY_TOKEN}`,
      },
    },
  },
  documents: ['src/graphql/**/*.graphql'],
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        strictScalars: true,
        scalars: { DateTime: 'string', JSON: 'Record' },
      },
    },
  },
}
export default config
```

Adicionar script `"codegen": "graphql-codegen"` no `package.json`. O README deve instruir a rodar `npm run codegen` antes do primeiro build.

---

## Ferramentas MCP a Implementar

### 1. Cards — CRUD (cards.ts)
- `create_card` — cria card numa fase específica. Parâmetros: `pipe_id`, `phase_id` (opcional — usa fase inicial se omitido), `title`, `assignee_ids[]` (opcional), `due_date` (ISO 8601, opcional), `fields_attributes[]` — array de `{ field_id, field_value }` para preencher campos. Retorna card criado com ID e URL.
- `get_card` — busca card por ID com todos os dados: título, fase atual, assignees, due date, labels, campos preenchidos (field_values), comentários e histórico de movimentações.
- `update_card` — atualiza título, due date, assignees e labels de um card.
- `update_card_field` — atualiza o valor de um campo específico de um card. Parâmetros: `card_id`, `field_id`, `new_value`. Trata tipos diferentes (text, select, date, checkbox, etc.).
- `move_card_to_phase` — move card para outra fase. Parâmetros: `card_id`, `destination_phase_id`.
- `delete_card` — deleta card. Requer `confirm: true`.
- `add_comment_to_card` — adiciona comentário num card. Parâmetros: `card_id`, `text`.
- `get_card_comments` — lista comentários de um card com autor e data.
- `assign_card` — atribui (ou remove) um usuário de um card. Parâmetros: `card_id`, `assignee_id`, `action` (assign | unassign).
- `create_child_card` — cria card filho vinculado a um card pai. Parâmetros: `parent_id`, `pipe_id`, `title`, `fields_attributes[]`.
- `get_card_children` — lista cards filhos de um card pai.

### 2. Busca & Filtros (search.ts)
- `list_cards` — lista cards de um pipe com filtros: `pipe_id`, `phase_id` (opcional), `assignee_ids[]`, `labels[]`, `due_date_gte`, `due_date_lte`, `created_after`, `created_before`, `search` (texto livre no título), `after` (cursor para paginação), `first` (limit, default 30). Retorna cards com pageInfo para paginação.
- `search_cards_by_field` — busca cards onde um campo específico tem um valor. Parâmetros: `pipe_id`, `field_id`, `field_value`. Útil para encontrar cards por ID externo, CPF, número de pedido etc.
- `get_overdue_cards` — cards com due date vencida num pipe, ordenados por mais atrasados. Parâmetros: `pipe_id`, `phase_id` (opcional).
- `get_unassigned_cards` — cards ativos sem responsável atribuído. Parâmetros: `pipe_id`, `phase_id` (opcional).
- `get_stale_cards` — cards parados numa fase há mais de N dias sem movimentação. Parâmetros: `pipe_id`, `phase_id` (opcional), `days` (threshold de inatividade).

### 3. Pipes & Fases (pipes.ts)
- `list_pipes` — lista todos os pipes da organização com: nome, total de cards ativos por fase, membros, SLA configurado, data da última atividade.
- `get_pipe` — detalhes completos de um pipe: fases (nome, cards_count, SLA), campos do formulário inicial, membros e seus papéis, configurações de SLA.
- `get_pipe_phases` — lista fases de um pipe com: nome, id, cards_count, campos que aparecem nessa fase, SLA da fase.
- `create_pipe` — cria novo pipe. Parâmetros: `organization_id`, `name`, `icon` (opcional), `phases[]` — array com nome e SLA de cada fase.
- `clone_pipe` — clona um pipe existente (estrutura, fases e campos — sem cards). Parâmetros: `pipe_id`, `new_name`.
- `update_pipe` — atualiza nome, ícone e configurações gerais de um pipe.
- `create_phase` — cria nova fase num pipe. Parâmetros: `pipe_id`, `name`, `only_admin_can_move_to_previous` (boolean).
- `update_phase` — atualiza nome e SLA de uma fase.

### 4. Campos & Formulários (fields.ts)
- `list_pipe_fields` — lista todos os campos do formulário inicial de um pipe com: id, label, tipo, obrigatório, opções (para select/radio).
- `list_phase_fields` — lista campos de uma fase específica.
- `create_field` — cria campo num pipe ou fase. Parâmetros: `pipe_id`, `phase_id` (opcional — se omitido, cria no formulário inicial), `label`, `type` (short_text | long_text | select | multiselect | radio_vertical | date | datetime | email | phone | number | currency | checkbox | attachment | connector), `required` (boolean), `options[]` (para tipos select/radio), `description` (opcional).
- `update_field` — atualiza label, descrição, obrigatoriedade e opções de um campo existente.
- `create_conditional_field` — cria campo condicional (exibido apenas quando outro campo tem um valor específico). Parâmetros: `field_id`, `condition_field_id`, `condition_value`.

### 5. Métricas de Processo (metrics.ts)
Todas as métricas são calculadas no lado do MCP a partir dos dados retornados pela API — não delegar ao LLM.

- `get_cycle_time` — tempo médio que cards ficam em cada fase antes de mover. Calculado sobre cards movidos num período. Parâmetros: `pipe_id`, `phase_id` (opcional — se omitido, retorna por todas as fases), `from`, `to` (ISO 8601). Retorna: média, mediana, p75, p95 em horas.
- `get_lead_time` — tempo médio do ciclo completo (entrada no pipe → fase final/done). Parâmetros: `pipe_id`, `from`, `to`. Retorna: média, mediana, p75, p95 em horas.
- `get_throughput` — cards concluídos (chegaram à fase final) por semana/mês. Parâmetros: `pipe_id`, `from`, `to`, `granularity` (weekly | monthly).
- `get_phase_distribution` — snapshot atual: quantos cards estão em cada fase do pipe. Parâmetros: `pipe_id`.
- `get_creation_vs_completion` — cards criados vs concluídos por período. Mostra se o pipe está acumulando trabalho. Parâmetros: `pipe_id`, `from`, `to`, `granularity`.
- `get_bottlenecks` — fases com maior tempo médio de permanência — identifica gargalos. Parâmetros: `pipe_id`, `from`, `to`. Retorna fases ordenadas por cycle time decrescente com benchmarks.

### 6. SLA Tracking (sla.ts)
- `get_sla_status` — status geral de SLA de um pipe: % dentro do prazo, violados e em risco, agrupados por fase. Parâmetros: `pipe_id`.
- `get_sla_violations` — cards com SLA violado num pipe, com fase atual, responsável, dias de atraso e título. Parâmetros: `pipe_id`, `phase_id` (opcional), `assignee_id` (opcional).
- `get_sla_forecast` — cards que vão vencer o SLA nas próximas N horas. Parâmetros: `pipe_id`, `hours` (default 24). Permite ação proativa.
- `get_sla_compliance_history` — evolução do SLA compliance (%) ao longo do tempo. Parâmetros: `pipe_id`, `from`, `to`, `granularity` (weekly | monthly).

### 7. Automações & Webhooks (automations.ts)
- `list_automations` — lista automações configuradas num pipe com: trigger, ações, status (ativa/inativa).
- `create_automation` — cria automação. Parâmetros: `pipe_id`, `name`, `trigger` (event type + condições), `actions[]` (tipo de ação + parâmetros). Suporta triggers: card.create, card.move, card.field_update, card.overdue. Suporta ações: move_card, assign_card, create_card, update_field, send_email.
- `toggle_automation` — ativa ou desativa uma automação. Parâmetros: `automation_id`, `active` (boolean).
- `delete_automation` — deleta automação. Requer `confirm: true`.
- `list_webhooks` — lista webhooks cadastrados com URL, eventos inscritos e status.
- `create_webhook` — cria webhook. Parâmetros: `pipe_id`, `url`, `actions[]` (card.create | card.done | card.expired | card.late | card.move | card.overdue | card.field_update), `headers` (objeto de headers HTTP opcionais para autenticação no destino).
- `delete_webhook` — deleta webhook. Requer `confirm: true`.

### 8. Organização & Membros (organization.ts)
- `get_organization` — dados da organização: nome, id, plano, total de pipes, total de membros.
- `list_organization_members` — lista todos os membros da organização com nome, email, papéis e pipes que têm acesso.
- `list_pipe_members` — lista membros de um pipe específico com seus papéis (admin | member).
- `invite_member_to_pipe` — convida um usuário para um pipe. Parâmetros: `pipe_id`, `email`, `role` (admin | member).
- `remove_member_from_pipe` — remove acesso de um membro a um pipe. Parâmetros: `pipe_id`, `member_id`.

### 9. Relatórios (reports.ts)
- `get_portfolio_report` — relatório consolidado de todos os pipes da organização: cards ativos por fase, SLA compliance %, cycle time médio, throughput da última semana, gargalo principal. Exportável em Markdown ou JSON.
- `get_pipe_report` — relatório completo de um pipe único: todas as métricas consolidadas (phase distribution, cycle time por fase, lead time, throughput, SLA status, top assignees por volume, gargalos). Ideal para reuniões de processo.
- `get_assignee_workload` — distribuição de cards por assignee num pipe: total de cards, cards atrasados, SLA violations por pessoa. Útil para balancear carga.

---

## Padrões de Implementação

### Cliente GraphQL (pipefyClient.ts)
```typescript
import { GraphQLClient } from 'graphql-request'
import { config } from './config'

export const pipefyClient = new GraphQLClient(
  'https://api.pipefy.com/graphql',
  {
    headers: { Authorization: `Bearer ${config.PIPEFY_TOKEN}` },
  }
)
```
- Wrapping de erros: interceptar erros GraphQL (`response.errors[]`) e lançar com mensagem legível incluindo o primeiro erro da lista
- Não usar fetch manual — deixar o `graphql-request` gerenciar

### Queries e Mutations
- Todas as queries e mutations ficam em arquivos `.graphql` na pasta `src/graphql/`
- Os tipos são importados de `src/generated/graphql.ts` — nunca escrever tipos de resposta manualmente
- Usar variáveis GraphQL sempre — nunca interpolar valores diretamente na query string

### Métricas calculadas no MCP
As tools de métricas (`get_cycle_time`, `get_lead_time`, `get_throughput` etc.) precisam buscar dados históricos de movimentação de cards. O Pipefy retorna `card_age` e timestamps de `phase_histories` em cada card. O MCP deve:
1. Buscar os cards do período com `list_cards` paginando até obter todos
2. Extrair os `phase_histories` de cada card
3. Calcular as métricas localmente
4. Retornar já agregado

### Config (config.ts)
```typescript
const envSchema = z.object({
  PIPEFY_TOKEN: z.string().min(1),
  PIPEFY_ORG_ID: z.string().min(1),
  PIPEFY_STALE_CARD_DAYS: z.coerce.number().default(5),
  PIPEFY_SLA_FORECAST_HOURS: z.coerce.number().default(24),
  PIPEFY_PAGE_SIZE: z.coerce.number().default(50),
})
export const config = envSchema.parse(process.env)
```

---

## README.md

Deve conter:
1. Pré-requisitos e instalação (`npm install && npm run codegen && npm run build`)
2. Como gerar o token no Pipefy (Profile → Personal access tokens) com escopos necessários
3. Como encontrar o `PIPEFY_ORG_ID` (via query GraphQL — incluir exemplo)
4. Configuração do `.env` com todos os campos explicados
5. Como adicionar ao MCP de um cliente (Claude Desktop, Kiro, etc.)
6. Lista completa de tools por categoria com exemplos de uso
7. Seção "Fluxo típico" com exemplo end-to-end: listar pipes → listar fases → criar card → preencher campos → mover entre fases
8. Seção "Atualizar tipos após mudança no schema" — quando rodar `npm run codegen` novamente

---

## Restrições
- Usar apenas a API GraphQL oficial do Pipefy (`https://api.pipefy.com/graphql`)
- Todo o código deve compilar sem erros com `strict: true` no tsconfig
- Nenhum `any` explícito — usar tipos gerados pelo codegen
- Queries e mutations nunca devem ser construídas por concatenação de strings — sempre usar variáveis GraphQL
- Tools de métricas calculam agregações no MCP, não delegam ao LLM
- Paginação automática nas tools de listagem: se `first` não for especificado, o MCP deve paginar automaticamente até trazer todos os resultados (respeitando limite de `PIPEFY_PAGE_SIZE` por request)