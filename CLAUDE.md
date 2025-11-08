# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Development Commands

### Running Locally
```bash
npm run dev        # Start Wrangler dev server on localhost:8787
```

### Testing
```bash
npm test                  # Run all tests once
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

**Important**: Tests use Vitest with `@cloudflare/vitest-pool-workers` to simulate the Cloudflare Workers environment. Tests for the Scryfall client disable rate limiting with `requestDelay: 0` to speed up test execution.

### Code Quality
```bash
npm run format       # Auto-format with Biome
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript type checking (no emit)
```

**Note**: Biome replaces both Prettier and ESLint. Configuration is in `biome.json`.

### Deployment
```bash
npm run deploy    # Manual deploy to Cloudflare Workers
```

Auto-deployment occurs on push to `main` via GitHub Actions (requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets).

## Adding New Scryfall Tools

1. **Add method to ScryfallClient** (`src/scryfall/client.ts`):
   - Implement the API call with proper typing
   - Ensure it uses the `fetch<T>()` method for automatic rate limiting and error handling

2. **Add types if needed** (`src/scryfall/types.ts`):
   - Mirror Scryfall's API response structure

3. **Register tool in MyMCP** (`src/index.ts`):
   - Call `this.server.tool()` in the `init()` method
   - Define Zod schema for parameters
   - Format response for MCP clients (text content)
   - Wrap in try-catch to handle `ScryfallAPIError`

4. **Add tests** (`src/scryfall/client.test.ts`):
   - Test the new ScryfallClient method
   - Use real API calls (integration tests) - tests are expected to make actual network requests

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
