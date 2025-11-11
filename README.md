# Scryfall MCP Server

A Model Context Protocol (MCP) server that surfaces the [Scryfall API](https://scryfall.com/docs/api) for Magic: The Gathering card data. Deployed on Cloudflare Workers.

## Quick Start

Configure your AI client to connect to the deployed instance of the server or download this repo and run it locally. 

### Claude Desktop

To use this MCP server with Claude Desktop, you'll need the [mcp-remote](https://www.npmjs.com/package/mcp-remote) proxy.

1. Open Claude Desktop settings: **Settings > Developer > Edit Config**
2. Add this configuration:

   ```json
   {
     "mcpServers": {
       "scryfall": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "https://scryfall-mcp-server.colin-hauch.workers.dev/sse"
         ]
       }
     }
   }
   ```

3. Restart Claude Desktop

### Local Development
```json
{
  "mcpServers": {
    "scryfall": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8787/sse"]
    }
  }
}
```

### Cloudflare AI Playground

1. Go to [https://playground.ai.cloudflare.com/](https://playground.ai.cloudflare.com/?model=@cf/mistralai/mistral-small-3.1-24b-instruct)
2. Pick a model (`mistral-small-3.1-24b-instruct` is selected by default here)
2. Enter your MCP server URL: `https://scryfall-mcp-server.colin-hauch.workers.dev`
3. Start using the Scryfall tools!

### Other MCP Clients

Any MCP-compatible client can connect to the server via:
- **SSE endpoint**: `/sse` (recommended for most clients)
- **MCP endpoint**: `/mcp` (for clients that support direct MCP protocol)

## Features

- **Search Cards**: Find Magic cards using Scryfall's powerful search syntax
- **Get Card Details**: Retrieve specific cards by name with fuzzy matching
- **Random Cards**: Get random cards with optional filtering
- **Field Selection**: Control exactly which card data is returned to optimize context usage

## Available MCP Tools

### `search_cards`
Search for Magic cards using Scryfall's search syntax. Returns all results from the current page (up to 175 cards).

**Parameters:**
- `query` (string, required): Search query using Scryfall syntax
  - Examples: `"lightning bolt"`, `"type:creature color:red"`, `"f:commander pow>=5"`
- `unique` (string, optional): Strategy for omitting similar cards
  - Options: `"cards"`, `"art"`, `"prints"`
- `order` (string, optional): Sort order
  - Options: `"name"`, `"set"`, `"released"`, `"rarity"`, `"color"`, `"usd"`, `"cmc"`, `"power"`, `"toughness"`, `"edhrec"`
- `dir` (string, optional): Sort direction
  - Options: `"auto"`, `"asc"`, `"desc"`
- `page` (number, optional): Page number for pagination (1-based). Use to access results beyond the first 175.
- `fields` (array or string, optional): Control which card data is returned (defaults to `"minimal"`)
  - Predefined groups: `"minimal"`, `"gameplay"`, `"pricing"`, `"imagery"`, `"full"`
  - Custom array: `["name", "mana_cost", "prices.usd"]`
  - See "Field Selection" section below for details

**Example:**
```json
{
  "query": "type:creature power>=5",
  "order": "power",
  "fields": "gameplay"
}
```

**Pagination example:**
```json
{
  "query": "type:creature",
  "page": 2
}
```

### `get_card_details`
Get detailed information for one or more cards by exact name. Uses Scryfall's collection endpoint for efficient bulk lookups (up to 75 cards per request with a single API call).

**Parameters:**
- `names` (array of strings, required): Exact card names to search for (can be single or multiple, max 75)
- `set` (string, optional): Filter by set code for all cards (e.g., `"mkm"`, `"one"`)
- `fields` (array or string, optional): Control which card data is returned (defaults to `"gameplay"`)
  - Predefined groups: `"minimal"`, `"gameplay"`, `"pricing"`, `"imagery"`, `"full"`
  - Custom array: `["name", "mana_cost", "prices.usd"]`
  - See "Field Selection" section below for details

**Note:** This tool uses exact name matching. Card names must match exactly (case-insensitive).

**Examples:**

Single card:
```json
{
  "names": ["Black Lotus"],
  "fields": ["name", "mana_cost", "prices", "legalities"]
}
```

Multiple cards:
```json
{
  "names": ["Black Lotus", "Mox Ruby", "Ancestral Recall"],
  "fields": "gameplay"
}
```

### `get_random_card`
Get a random Magic card.

**Parameters:**
- `query` (string, optional): Filter random selection using Scryfall search syntax (e.g., `"type:creature"`)
- `fields` (array or string, optional): Control which card data is returned
  - Predefined groups: `"minimal"`, `"gameplay"`, `"pricing"`, `"imagery"`, `"full"`
  - Custom array: `["name", "mana_cost", "prices.usd"]`
  - See "Field Selection" section below for details

**Example:**
```json
{
  "query": "type:legendary",
  "fields": "minimal"
}
```

## Field Selection

All card-related tools support optional field selection to control which data is returned, helping you optimize context usage in your AI workflows.

### Predefined Field Groups

Use these convenient presets for common use cases:

- **`"minimal"`** - Essential card info: name, mana_cost, type_line, oracle_text
- **`"gameplay"`** - Gameplay-relevant data: minimal + colors, color_identity, cmc, power, toughness, loyalty, rarity
- **`"pricing"`** - Price information: name, prices
- **`"imagery"`** - Image data: name, artist, image_uris, illustration_id
- **`"full"`** - All available fields (default when `fields` is not specified)

### Custom Field Arrays

Specify exactly which fields you need:

```json
{
  "name": "Lightning Bolt",
  "fields": ["name", "mana_cost", "oracle_text", "prices.usd"]
}
```

### Nested Fields

Access nested object properties using dot notation:

```json
{
  "query": "format:vintage",
  "fields": ["name", "prices.usd", "prices.eur", "image_uris.normal"]
}
```

### Available Fields Reference

The MCP server provides a resource at `scryfall://fields/reference` with a complete list of all available fields. Access this through your MCP client to see all options.

### Examples

**Minimal context for quick lookups:**
```json
{
  "query": "lightning bolt",
  "fields": "minimal"
}
```

**Price checking:**
```json
{
  "names": ["Mox Ruby"],
  "fields": ["name", "set", "prices.usd", "prices.usd_foil"]
}
```

**Gameplay analysis:**
```json
{
  "query": "type:creature cmc<=2",
  "fields": "gameplay"
}
```

## MCP Resources

The server exposes additional resources for enhanced functionality:

### `scryfall://search-syntax/full`
Complete reference guide for Scryfall search syntax with all keywords, operators, and advanced filters.

### `scryfall://fields/reference`
Complete list of available fields for custom field selection with examples and usage guidance.

### Rate Limiting & Performance

The server implements comprehensive rate limiting to respect [Scryfall API guidelines](https://scryfall.com/docs/api):

- **Proactive rate limiting**: 100ms delay between requests
- **Automatic retries**: Exponential backoff on HTTP 429 errors (1s → 2s → 4s)
- **Error handling**: Structured error responses with detailed messages

## License

This project is provided as-is for portfolio and educational purposes.

