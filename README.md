# Scryfall MCP Server

A Model Context Protocol (MCP) server that surfaces the [Scryfall API](https://scryfall.com/docs/api) for Magic: The Gathering card data. Deployed on Cloudflare Workers with automatic CI/CD.

## Features

- **Search Cards**: Find Magic cards using Scryfall's powerful search syntax
- **Get Card Details**: Retrieve specific cards by name with fuzzy matching
- **Random Cards**: Get random cards with optional filtering
- **Card Rulings**: Access official card rulings and errata
- **Set Information**: Query Magic: The Gathering set data
- **Autocomplete**: Get card name suggestions as you type

## Available MCP Tools

### `search_cards`
Search for Magic cards using Scryfall's search syntax.

**Parameters:**
- `query` (string): Search query (e.g., "lightning bolt", "type:creature color:red")
- `unique` (optional): Strategy for omitting similar cards ("cards", "art", "prints")
- `order` (optional): Sort order (name, set, released, rarity, color, usd, etc.)
- `dir` (optional): Sort direction (auto, asc, desc)
- `page` (optional): Page number for pagination

### `get_card`
Get a specific card by name.

**Parameters:**
- `name` (string): Card name to search for
- `fuzzy` (optional boolean): Use fuzzy name matching
- `set` (optional string): Filter by set code (e.g., "mkm")

### `get_random_card`
Get a random Magic card.

**Parameters:**
- `query` (optional string): Filter random selection (e.g., "type:creature")

### `get_rulings`
Get official rulings for a card.

**Parameters:**
- `card_id` (string): Scryfall card ID

### `get_set`
Get information about a Magic set.

**Parameters:**
- `code` (string): Set code (e.g., "mkm" for Murders at Karlov Manor)

### `autocomplete`
Get card name suggestions.

**Parameters:**
- `query` (string): Partial card name to autocomplete

## Development Setup

### Prerequisites
- Node.js 20+
- npm
- Cloudflare account (for deployment)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

   The server will be available at `http://localhost:8787`

3. **Run tests:**
   ```bash
   npm test              # Run tests once
   npm run test:watch    # Watch mode
   npm run test:coverage # With coverage report
   ```

4. **Code quality:**
   ```bash
   npm run format     # Format code with Biome
   npm run lint:fix   # Fix linting issues
   npm run type-check # TypeScript type checking
   ```

## Deployment

### Automatic Deployment (Recommended)

This repository is configured for automatic deployment to Cloudflare Workers via GitHub Actions.

1. **Set up GitHub Secrets:**

   Go to your GitHub repository Settings > Secrets and variables > Actions, and add:

   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
     - Create at: https://dash.cloudflare.com/profile/api-tokens
     - Required permissions: "Edit Cloudflare Workers"

   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
     - Find at: https://dash.cloudflare.com (right sidebar)

2. **Deploy:**

   Simply push to the `main` branch:
   ```bash
   git add .
   git commit -m "Deploy changes"
   git push origin main
   ```

   GitHub Actions will automatically:
   - Run linting and type checks
   - Run tests
   - Deploy to Cloudflare Workers if all checks pass

### Manual Deployment

Deploy directly to Cloudflare Workers:

```bash
npm run deploy
```

Your server will be deployed to: `https://scryfall-mcp-server.<your-account>.workers.dev`

## Connecting to MCP Clients

### Cloudflare AI Playground

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL: `scryfall-mcp-server.<your-account>.workers.dev/sse`
3. Start using the Scryfall tools!

### Claude Desktop

Use the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote) to connect Claude Desktop to your server.

1. Open Claude Desktop settings: Settings > Developer > Edit Config
2. Add this configuration:

   ```json
   {
     "mcpServers": {
       "scryfall": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "http://localhost:8787/sse"
         ]
       }
     }
   }
   ```

3. For production, replace the URL with your deployed endpoint:
   ```json
   "args": ["mcp-remote", "https://scryfall-mcp-server.<your-account>.workers.dev/sse"]
   ```

4. Restart Claude Desktop

### Other MCP Clients

Any MCP client can connect to the server via:
- SSE endpoint: `/sse`
- MCP endpoint: `/mcp`

## Project Structure

```
scryfall-mcp-server/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: Lint, type-check, test
│       └── deploy.yml      # Auto-deploy to Cloudflare
├── src/
│   ├── index.ts            # Main MCP server implementation
│   ├── index.test.ts       # Server tests
│   └── scryfall/
│       ├── client.ts       # Scryfall API client
│       ├── client.test.ts  # API client tests
│       └── types.ts        # TypeScript types for Scryfall API
├── biome.json              # Biome formatter/linter config
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest test configuration
└── wrangler.jsonc          # Cloudflare Workers configuration
```

## Development Workflow

### Branching Strategy

- `main` - Production branch (auto-deploys)
- `feature/*` - New features
- `fix/*` - Bug fixes

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes and test:
   ```bash
   npm run dev        # Test locally
   npm test           # Run tests
   npm run type-check # Check types
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Add my feature"
   git push origin feature/my-feature
   ```

4. Open a Pull Request on GitHub
   - CI will automatically run tests and checks
   - Merge to `main` when ready
   - Automatic deployment will trigger

## Technology Stack

- **Runtime**: Cloudflare Workers (serverless edge computing)
- **MCP SDK**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- **Agent Framework**: [Cloudflare Agents](https://developers.cloudflare.com/agents/)
- **Language**: TypeScript
- **Testing**: Vitest with Cloudflare Workers pool
- **Code Quality**: Biome (formatter + linter)
- **CI/CD**: GitHub Actions
- **Deployment**: Wrangler (Cloudflare CLI)

## API Rate Limiting

The Scryfall client implements comprehensive rate limiting to comply with [Scryfall API guidelines](https://scryfall.com/docs/api):

### Automatic Rate Limiting
- **Default delay**: 100ms between requests (Scryfall recommends 50-100ms)
- **Configurable**: Customize delay via `ScryfallClientOptions`
- **Prevents HTTP 429**: Proactive rate limiting avoids "Too Many Requests" errors

### HTTP 429 Retry with Exponential Backoff
When rate limits are exceeded, the client automatically retries with exponential backoff:
- **Default retries**: 3 attempts
- **Backoff strategy**: 1s, 2s, 4s (exponential)
- **Configurable**: Customize via `maxRetries` and `initialBackoff` options

### Configuration Options

```typescript
const client = new ScryfallClient({
  requestDelay: 100,      // Delay between requests (ms)
  maxRetries: 3,          // Max retry attempts for 429 errors
  initialBackoff: 1000,   // Initial backoff time (ms)
  userAgent: 'your-app',  // Custom User-Agent
});
```

### Best Practices
- **Cache responses**: Store card data locally for 24+ hours
- **Batch requests**: Group related queries when possible
- **Monitor logs**: Watch for rate limit warnings in console
- **Adjust delays**: Increase `requestDelay` if you frequently hit 429s

### Error Handling
The client throws `ScryfallAPIError` with detailed information:
- HTTP status code
- Error code from Scryfall
- Human-readable error message

## Contributing

This is a portfolio project demonstrating industry-standard practices:
- Automated testing
- CI/CD pipeline
- Type safety
- Code quality tooling
- Comprehensive documentation

## License

This project is provided as-is for portfolio and educational purposes.

## Resources

- [Scryfall API Documentation](https://scryfall.com/docs/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) 
