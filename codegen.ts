import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: {
    'https://api.pipefy.com/graphql': {
      headers: {
        Authorization: `Bearer ${process.env.PIPEFY_TOKEN}`,
      },
    },
  },
  documents: ['src/graphql/**/*.ts'],
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        strictScalars: true,
        avoidOptionals: false,
        nonOptionalTypename: false,
        scalars: {
          DateTime: 'string',
          JSON: 'Record<string, unknown>',
        },
      },
    },
  },
}

export default config
