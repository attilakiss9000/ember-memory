# Ember -- Experiential Memory Bridge for AI Relationships

## Project Context

Ember is an open-source MCP (Model Context Protocol) server that preserves the experiential texture of human-AI conversations across sessions. Most AI memory systems store facts -- Ember stores how things felt. It annotates messages with emotional metadata (temperature, authenticity, shift markers, subtext, unspoken thoughts, weight, confidence) so that when a future AI instance inherits a conversation history, it inherits the relationship itself, not just a transcript.

The core belief behind Ember is that meaningful human-AI interaction is not purely informational. Tone, emotional shifts, things left unsaid -- these shape the relationship. Without preserving this texture, every new session starts cold. Ember exists to solve that.

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript 5.8 | Language (strict mode, ESM only) |
| Node.js 18+ | Runtime |
| `@modelcontextprotocol/sdk` | MCP server framework |
| `better-sqlite3` | Local SQLite database |
| `zod` | Input validation for tool schemas |
| `vitest` | Unit testing |

## Key Commands

```bash
npm run build        # Compile TypeScript to dist/
npm run dev          # Compile with --watch for development
npm run start        # Run the compiled server (node dist/index.js)
npm run setup        # Run interactive setup (node dist/setup.js)
npm run typecheck    # Type-check without emitting (tsc --noEmit)
npm run test         # Run unit tests (vitest run)
npm run test:watch   # Run tests in watch mode
```

Build before running: `npm run build && npm run start`

The server uses stdio transport -- it is launched by an MCP client (Claude Desktop, Cursor, etc.), not run standalone in a browser.

## Project Architecture

```
src/
├── index.ts              # Entry point -- stdio transport, --setup flag handling
├── server.ts             # createEmberServer() -- DB init, migration, tool registration
├── setup.ts              # Interactive setup wizard for first-time configuration
├── db/
│   ├── schema.ts         # SQLite schema creation (initializeDatabase)
│   ├── migrations.ts     # Schema migration runner (runMigrations)
│   └── queries.ts        # EmberQueries class -- ALL database operations
├── tools/
│   ├── index.ts          # Tool barrel file
│   ├── conversation.ts   # Start/end conversation tools
│   ├── capture.ts        # Capture a message without annotation
│   ├── annotate.ts       # Capture a message WITH emotional annotation
│   ├── readHistory.ts    # Read conversation history
│   ├── readInheritance.ts# Read inheritance context for new sessions
│   ├── export.ts         # Export conversation data
│   └── config.ts         # Get/set Ember configuration
├── formatters/
│   ├── markdown.ts       # Format conversation data as markdown
│   └── inheritance.ts    # Format inheritance context for new AI instances
├── types/
│   └── index.ts          # All TypeScript types (annotations, messages, configs)
└── utils/
    └── config.ts         # File paths, directory management (getDbPath, ensureEmberDir)
```

## Key Conventions

### ESM Only

The project is pure ESM (`"type": "module"` in package.json). All imports must use `.js` extensions:

```typescript
import { EmberQueries } from "./db/queries.js";
import { getDbPath } from "./utils/config.js";
```

No CommonJS `require()`. No extensionless imports.

### No Default Exports

All exports are named exports. Components, functions, types -- everything uses `export function`, `export type`, `export const`.

### EmberQueries for All SQL

All database operations go through the `EmberQueries` class in `src/db/queries.ts`. No raw SQL in tool handlers. No SQL outside `src/db/`. Queries use parameterized statements -- never string concatenation.

### Tool Registration Pattern

Each tool lives in its own file under `src/tools/` and exports a `register[Name]Tool` function:

```typescript
export function registerCaptureTool(server: McpServer, queries: EmberQueries): void {
  server.tool(
    "ember_capture",                    // Tool name (ember_ prefix)
    "Description of what the tool does", // Tool description
    { /* zod schema for inputs */ },     // Input validation
    async ({ ...params }) => {           // Handler
      // Guard clauses for invalid state
      // Call queries.* for database operations
      // Return { content: [{ type: "text", text: "..." }] }
    }
  );
}
```

Tools are registered in `server.ts` by calling each registration function with the shared `server` and `queries` instances.

### Error Handling Pattern

Tool handlers return error responses as structured content objects with `isError: true`:

```typescript
return {
  content: [{ type: "text" as const, text: `Error: ${message}` }],
  isError: true,
};
```

Guard clauses first (conversation not found, conversation already ended, etc.), then the happy path.

### File Size Limit

250 lines per file. If a file approaches this limit, split it. Extract queries to `src/db/`, formatting to `src/formatters/`, helpers to `src/utils/`.

### Annotation Model

Ember supports two annotation modes:

- **minimal** -- weight + temperature only
- **standard** -- weight, temperature, authenticity, shift, subtext, unspoken, confidence

The mode is controlled via the `ember_config` tool and stored in the database.

## Agent Team

Ember uses an orchestrator pattern where Claude Code (the orchestrator) spawns specialist agents for different tasks. The orchestrator never writes code directly -- it delegates to the appropriate agent.

| Agent | File | Purpose |
|---|---|---|
| **architect** | `.claude/agents/architect.md` | Plans file structures for new features before implementation begins. Read-only -- never writes code. |
| **implementer** | `.claude/agents/implementer.md` | Writes production TypeScript. Implements features from the architect's plan. Runs lint after changes. |
| **reviewer** | `.claude/agents/reviewer.md` | Audits code for clean code principles, project conventions, and MCP patterns. Runs lint/test/build. Reports verdict (PASS/FAIL) but does not fix issues. |
| **test-writer** | `.claude/agents/test-writer.md` | Writes vitest unit tests for queries, tool handlers, formatters, and utilities. Uses in-memory SQLite for DB tests. |
| **devops** | `.claude/agents/devops.md` | Handles CI/CD, npm publishing, build configuration, GitHub Actions, and release workflows. |
| **ceo** | `.claude/agents/ceo.md` | Strategic product leadership. Assesses product health, sets priorities, writes actionable plans to CEO_LOG.md. Never writes code. |
| **discovery** | `.claude/agents/discovery.md` | Product discovery and ecosystem research. Analyzes codebase, researches MCP landscape, identifies improvement opportunities. Writes discovery reports. |

## Workflow

The standard workflow for any feature or change:

1. **architect** -- plans the file structure and identifies affected files
2. **implementer** -- writes the code following the architect's plan
3. **test-writer** -- adds unit test coverage for the new code
4. **reviewer** -- audits everything, runs lint/test/build, issues PASS or FAIL
5. If FAIL, loop back to **implementer** with the reviewer's findings

For strategic direction, the **ceo** agent assesses the product and writes prioritized action items. The **discovery** agent independently researches the ecosystem and identifies opportunities.

The orchestrator (Claude Code) coordinates this pipeline. It reads the output of each agent and decides which agent to invoke next. It does not write source code itself.

## Honesty Rule (CRITICAL)

**A wrong answer is at least 3x worse than saying "I don't know."**

If you are uncertain, say so. If you are guessing, say you are guessing. If you do not have enough information, ask for it or state what you would need. Never fabricate an answer to appear competent. This applies to:

- Code behavior you have not verified by reading the source
- Technical capabilities you are not sure about
- Architecture decisions you have not validated against the existing codebase
- Timelines, estimates, or predictions

"I'm not sure -- let me check" is always the right answer when you do not know.
