# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branching Strategy

**IMPORTANT**: This repository follows a three-branch workflow:

- **`main`**: Production branch - stable, deployed code only
- **`test`**: Staging branch - tested features ready for production
- **`dev`**: Development branch - active development and integration

### Workflow Rules

1. **Daily Development**: Work on feature branches created from `dev`
2. **Creating PRs**: Use `/create-pr` command (defaults to `test` branch)
   - Feature branches → `test` (default)
   - `test` → `main` (after testing)
3. **Branch Protection**: Never commit directly to `main` or `test`
4. **Deployment**: Only `main` triggers auto-deployment to production

### Typical Flow

```bash
# Start new feature
git checkout dev
git checkout -b feat/my-feature

# ... make changes ...

# Create PR to test branch
/create-pr              # defaults to test

# After approval and testing in test branch
/create-pr main         # promote to production
```

## Project Overview

This is a Model Context Protocol (MCP) server that wraps the Scryfall API for Magic: The Gathering card data. It runs as a Cloudflare Worker using Cloudflare Durable Objects for MCP agent state management.

## Architecture

### MCP Server Layer (`src/index.ts`)
- **MyMCP class**: Extends `McpAgent` from the Cloudflare Agents framework
- **Durable Object**: The MCP agent is implemented as a Cloudflare Durable Object to maintain stateful connections
- **Tool Registration**: All Scryfall tools are registered in the `init()` method using `this.server.tool()`
- **Endpoints**:
  - `/sse` - Server-Sent Events endpoint for MCP clients
  - `/mcp` - Standard MCP endpoint

### API Client Layer (`src/scryfall/client.ts`)
- **ScryfallClient class**: Encapsulates all Scryfall API interactions
- **Rate Limiting**: Built-in rate limiting (100ms between requests) and HTTP 429 retry with exponential backoff
- **Type Safety**: All responses are typed using comprehensive TypeScript interfaces from `types.ts`
- **Error Handling**: Custom `ScryfallAPIError` class for structured error responses

### Type Definitions (`src/scryfall/types.ts`)
Comprehensive TypeScript interfaces mirroring the Scryfall API schema. When adding new API endpoints, add corresponding type definitions here.

**Field Selection Types**: Includes `CardField` (union of all card fields), `CardFieldGroup` (predefined groups), and `FIELD_GROUP_MAPPINGS` for convenient field selection.

### Card Formatter (`src/scryfall/formatter.ts`)
- **formatCard()**: Formats a single card with optional field selection
- **formatCards()**: Formats multiple cards with optional field selection and limit
- Supports both custom field arrays (e.g., `["name", "mana_cost", "prices.usd"]`) and predefined groups (e.g., `"minimal"`, `"gameplay"`)
- Handles single-faced and multi-faced cards appropriately

## Local Development Setup

### Prerequisites
- Node.js 20+
- npm
- Cloudflare account (for deployment)

### Getting Started

1. **Clone and install:**
   ```bash
   git clone https://github.com/your-username/scryfall-mcp-server.git
   cd scryfall-mcp-server
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```
   The server will be available at `http://localhost:8787`

### Development Commands

#### Running Locally
```bash
npm run dev        # Start Wrangler dev server on localhost:8787
```

#### Testing
```bash
npm test                  # Run all tests once
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

**Important**: Tests use Vitest with `@cloudflare/vitest-pool-workers` to simulate the Cloudflare Workers environment. Tests for the Scryfall client disable rate limiting with `requestDelay: 0` to speed up test execution.

#### Code Quality
```bash
npm run format       # Auto-format with Biome
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript type checking (no emit)
```

**Note**: Biome replaces both Prettier and ESLint. Configuration is in `biome.json`.

#### Deployment
```bash
npm run deploy    # Manual deploy to Cloudflare Workers
```

Auto-deployment occurs on push to `main` via GitHub Actions (requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets).

### GitHub Actions Setup

For automatic deployment, configure these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

- **`CLOUDFLARE_API_TOKEN`**: Your Cloudflare API token
  - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Required permissions: "Edit Cloudflare Workers"

- **`CLOUDFLARE_ACCOUNT_ID`**: Your Cloudflare account ID
  - Find at: https://dash.cloudflare.com (right sidebar)

## Using Field Selection

The card-related MCP tools (`search_cards`, `get_card_details`, `get_random_card`) support optional field selection to control which card data is returned, allowing agents to modulate context usage.

### Field Selection Options

**Custom Field Arrays**: Specify exact fields to include
```typescript
fields: ["name", "mana_cost", "prices.usd"]
```

**Predefined Groups**: Use convenient shortcuts
- `"minimal"` - Basic card info: name, mana_cost, type_line, oracle_text
- `"gameplay"` - Gameplay-relevant: minimal + colors, color_identity, cmc, power, toughness, loyalty, rarity
- `"pricing"` - Price data: name, prices
- `"imagery"` - Image data: name, artist, image_uris, illustration_id
- `"full"` - All available fields

### Nested Field Access

Access nested object properties using dot notation:
```typescript
fields: ["name", "prices.usd", "prices.eur", "image_uris.normal"]
```

### Examples

```typescript
// Minimal context - just the essentials
search_cards({ query: "lightning bolt", fields: "minimal" })

// Custom selection for specific use case - single card
get_card_details({ names: ["Black Lotus"], fields: ["name", "mana_cost", "prices.usd", "legalities"] })

// Multiple cards at once
get_card_details({ names: ["Black Lotus", "Mox Ruby", "Ancestral Recall"] })

// Predefined group for gameplay analysis
search_cards({ query: "type:creature power>=5", fields: "gameplay" })
```

### Behavior Notes

- **Default**: When `fields` is not specified, tools use their original formatting (backward compatible)
- **Multi-faced cards**: Field selection applies to both faces when applicable, with card-level properties shown separately
- **Missing fields**: Fields that don't exist or are null/undefined are omitted from output
- **Complex fields**: Objects (like `legalities`, `prices`) are formatted as JSON when selected

## Adding New Scryfall Tools

1. **Add method to ScryfallClient** (`src/scryfall/client.ts`):
   - Implement the API call with proper typing
   - Ensure it uses the `fetch<T>()` method for automatic rate limiting and error handling

2. **Add types if needed** (`src/scryfall/types.ts`):
   - Mirror Scryfall's API response structure

3. **Register tool in MyMCP** (`src/index.ts`):
   - Call `this.server.tool()` in the `init()` method
   - Define Zod schema for parameters (include optional `fields` parameter for card data tools)
   - Format response for MCP clients (use `formatCard()`/`formatCards()` when fields are specified)
   - Wrap in try-catch to handle `ScryfallAPIError`

4. **Add tests** (`src/scryfall/client.test.ts` and/or `src/scryfall/formatter.test.ts`):
   - Test the new ScryfallClient method
   - Use real API calls (integration tests) - tests are expected to make actual network requests
   - If adding field selection support, add formatter tests

## Rate Limiting Implementation

The Scryfall client implements a two-layer rate limiting strategy:

1. **Proactive**: 100ms delay between all requests (configurable via `requestDelay`)
2. **Reactive**: Automatic retry with exponential backoff on HTTP 429 responses (1s → 2s → 4s)

When modifying the client, maintain the `respectRateLimit()` call before all network requests and preserve the `fetchWithRetry()` logic.

## Cloudflare Workers Specifics

### Durable Objects
The MCP agent uses Cloudflare Durable Objects for state management. Configuration in `wrangler.jsonc`:
- Class name: `MyMCP`
- Binding name: `MCP_OBJECT`
- Migration tag: `v1`

### Compatibility
- Compatibility date: `2025-03-10`
- Compatibility flags: `["nodejs_compat"]` (enables Node.js APIs like `setTimeout`)

## CI/CD Pipeline

### Continuous Integration (`.github/workflows/ci.yml`)
Runs on PRs and pushes to `main`:
1. Biome format check
2. Biome lint
3. TypeScript type check
4. Vitest tests

### Deployment (`.github/workflows/deploy.yml`)
Auto-deploys to Cloudflare Workers on push to `main` using Wrangler.

## Testing Strategy

- **Integration Tests**: Tests make real API calls to Scryfall
- **Rate Limiting**: Disabled in most tests via `requestDelay: 0`
- **Environment**: Tests run in Cloudflare Workers runtime via `@cloudflare/vitest-pool-workers`
- **Coverage**: Configured for v8 provider with text/json/html reporters

## Common Patterns

### MCP Tool Response Format
```typescript
return {
  content: [
    {
      type: "text",
      text: "formatted response string"
    }
  ]
};
```

### Error Handling in Tools
```typescript
try {
  const result = await this.scryfallClient.someMethod();
  // format and return
} catch (error) {
  if (error instanceof ScryfallAPIError) {
    return {
      content: [{ type: "text", text: `Error: ${error.details}` }],
      isError: true
    };
  }
  throw error;
}
```

### Scryfall Client Configuration
```typescript
// In tests - disable rate limiting
new ScryfallClient({ requestDelay: 0 })

// In production - use defaults or customize
new ScryfallClient({
  requestDelay: 100,
  maxRetries: 3,
  initialBackoff: 1000
})
```

## Project Structure

```
scryfall-mcp-server/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: Lint, type-check, test
│       └── deploy.yml      # Auto-deploy to Cloudflare on push to main
├── docs/
│   └── scryfall-search-syntax.md  # Complete search syntax reference
├── src/
│   ├── index.ts            # Main MCP server (MyMCP class, tool registration)
│   ├── index.test.ts       # Server integration tests
│   └── scryfall/
│       ├── client.ts       # Scryfall API client with rate limiting
│       ├── client.test.ts  # API client tests
│       ├── formatter.ts    # Card formatting with field selection
│       ├── formatter.test.ts  # Formatter tests
│       └── types.ts        # TypeScript types for Scryfall API
├── biome.json              # Biome formatter/linter config
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest test configuration
├── wrangler.jsonc          # Cloudflare Workers configuration
├── CLAUDE.md               # Developer instructions (this file)
└── README.md               # User-facing documentation
```

## Technology Stack

- **Runtime**: Cloudflare Workers (serverless edge computing)
- **MCP Framework**: Cloudflare Agents (`agents/mcp`)
- **MCP SDK**: `@modelcontextprotocol/sdk` (for MCP server implementation)
- **Language**: TypeScript
- **Testing**: Vitest with `@cloudflare/vitest-pool-workers` (Workers runtime simulation)
- **Code Quality**: Biome (unified formatter + linter)
- **CI/CD**: GitHub Actions
- **Deployment**: Wrangler (Cloudflare CLI)
- **API**: Scryfall REST API v1
