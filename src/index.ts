import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ScryfallClient, ScryfallAPIError } from "./scryfall/client";
import { formatCard, formatCards } from "./scryfall/formatter.js";
import type { CardField, CardFieldGroup } from "./scryfall/types.js";
import {
	FIELD_GROUP_KEYS,
	FIELD_GROUP_MAPPINGS,
	ALL_VALID_FIELDS,
} from "./scryfall/types.js";
import searchSyntaxDoc from "../docs/scryfall-search-syntax.md";

// Define our MCP agent with Scryfall tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Scryfall MCP Server",
		version: "0.1.0",
	});

	private scryfallClient = new ScryfallClient();

	async init() {
		// Search for Magic: The Gathering cards
		this.server.tool(
			"search_cards",
			{
				query: z.string().describe(
					`Scryfall search query. Common patterns:

Basic Filters:
  - Card name: "lightning bolt" or name:"dark ritual"
  - Type: t:creature, t:instant, t:"legendary creature"
  - Color: c:red, c:uw (blue/white), c>=2 (2+ colors)
  - Oracle text: o:"draw a card", o:"enters the battlefield"

Card Properties:
  - Mana value: mv=3, mv<=2, mv>=7
  - Mana cost: m:2ww (two generic + double white)
  - Power/Toughness: pow>=5, tou<3, pow>tou

Format & Rarity:
  - Format legality: f:standard, f:commander, f:modern
  - Rarity: r:rare, r:mythic, r:common

Operators:
  - Combine terms: "t:creature c:red pow>=4" (AND is implicit)
  - OR operator: "t:elf or t:goblin"
  - Negation: "-c:blue" or "not:reprint"
  - Grouping: "t:legendary (t:elf or t:goblin)"

Examples:
  - "t:creature c:red pow>=5" → Red creatures with power 5+
  - "o:\\"draw a card\\" f:standard" → Standard-legal cards with card draw
  - "t:instant mv<=2 c:u" → Blue instants costing 2 or less
  - "t:planeswalker (c:wr or c:wb)" → Red/white or white/black planeswalkers

Advanced Syntax:
For complex queries including regex, display options, set filters, and more, access the complete documentation via the MCP resource "Scryfall Search Syntax - Complete Reference" (URI: scryfall://search-syntax/full).`,
				),
				unique: z
					.enum(["cards", "art", "prints"])
					.optional()
					.describe("Strategy for omitting similar cards"),
				order: z
					.enum([
						"name",
						"set",
						"released",
						"rarity",
						"color",
						"usd",
						"cmc",
						"power",
						"toughness",
						"edhrec",
					])
					.optional()
					.describe("Sort order"),
				dir: z
					.enum(["auto", "asc", "desc"])
					.optional()
					.describe("Sort direction"),
				page: z.number().optional().describe("Page number for pagination"),
				fields: z
					.union([z.array(z.string()), z.enum(FIELD_GROUP_KEYS)])
					.optional()
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'pricing', 'imagery', 'full'). For a complete list of available fields, see the 'Available Card Fields' resource at scryfall://fields/reference",
					),
			},
			async ({ query, unique, order, dir, page, fields }) => {
				try {
					const result = await this.scryfallClient.searchCards(query, {
						unique,
						order,
						dir,
						page,
					});

					// If fields are specified, use the formatter
					if (fields) {
						const formatted = formatCards(
							result.data,
							fields as CardField[] | CardFieldGroup,
							10,
						);
						return {
							content: [
								{
									type: "text",
									text: formatted,
								},
							],
						};
					}

					// Default formatting (backward compatible)
					const summary = `Found ${result.total_cards || result.data.length} cards matching "${query}"`;
					const cardList = result.data
						.slice(0, 10)
						.map((card) => {
							const price = card.prices.usd ? `$${card.prices.usd}` : "N/A";
							return `- ${card.name} (${card.set.toUpperCase()}) - ${card.type_line} - ${price}`;
						})
						.join("\n");

					const hasMore = result.has_more
						? "\n\n(More results available - use page parameter)"
						: "";

					return {
						content: [
							{
								type: "text",
								text: `${summary}\n\n${cardList}${hasMore}`,
							},
						],
					};
				} catch (error) {
					if (error instanceof ScryfallAPIError) {
						return {
							content: [
								{
									type: "text",
									text: `Scryfall API Error: ${error.details}`,
								},
							],
							isError: true,
						};
					}
					throw error;
				}
			},
		);

		// Get a specific card by name
		this.server.tool(
			"get_card",
			{
				name: z.string().describe("Card name to search for"),
				fuzzy: z
					.boolean()
					.optional()
					.describe("Use fuzzy name matching (default: false)"),
				set: z
					.string()
					.optional()
					.describe("Set code to filter by (e.g., 'mkm')"),
				fields: z
					.union([z.array(z.string()), z.enum(FIELD_GROUP_KEYS)])
					.optional()
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'pricing', 'imagery', 'full'). For a complete list of available fields, see the 'Available Card Fields' resource at scryfall://fields/reference",
					),
			},
			async ({ name, fuzzy, set, fields }) => {
				try {
					const card = await this.scryfallClient.getCardNamed(name, {
						fuzzy,
						set,
					});

					// If fields are specified, use the formatter
					if (fields) {
						const formatted = formatCard(
							card,
							fields as CardField[] | CardFieldGroup,
						);
						return {
							content: [
								{
									type: "text",
									text: formatted,
								},
							],
						};
					}

					// Default formatting (backward compatible)
					const price = card.prices.usd ? `$${card.prices.usd}` : "N/A";
					const text = card.oracle_text || "No oracle text";
					const image =
						card.image_uris?.normal ||
						card.card_faces?.[0]?.image_uris?.normal ||
						"No image";

					return {
						content: [
							{
								type: "text",
								text: `**${card.name}** (${card.set.toUpperCase()} ${card.collector_number})
Mana Cost: ${card.mana_cost || "N/A"}
Type: ${card.type_line}
${card.power && card.toughness ? `Power/Toughness: ${card.power}/${card.toughness}` : ""}
${card.loyalty ? `Loyalty: ${card.loyalty}` : ""}

${text}

Price: ${price}
Rarity: ${card.rarity}
Artist: ${card.artist || "Unknown"}

Image: ${image}
Scryfall: ${card.scryfall_uri}`,
							},
						],
					};
				} catch (error) {
					if (error instanceof ScryfallAPIError) {
						return {
							content: [
								{
									type: "text",
									text: `Card not found: ${error.details}`,
								},
							],
							isError: true,
						};
					}
					throw error;
				}
			},
		);

		// Get a random card
		this.server.tool(
			"get_random_card",
			{
				query: z
					.string()
					.optional()
					.describe(
						"Optional search query to filter random selection (e.g., 'type:creature')",
					),
				fields: z
					.union([z.array(z.string()), z.enum(FIELD_GROUP_KEYS)])
					.optional()
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'pricing', 'imagery', 'full'). For a complete list of available fields, see the 'Available Card Fields' resource at scryfall://fields/reference",
					),
			},
			async ({ query, fields }) => {
				try {
					const card = await this.scryfallClient.getRandomCard(query);

					// If fields are specified, use the formatter
					if (fields) {
						const formatted = formatCard(
							card,
							fields as CardField[] | CardFieldGroup,
						);
						return {
							content: [
								{
									type: "text",
									text: `**Random Card**\n\n${formatted}`,
								},
							],
						};
					}

					// Default formatting (backward compatible)
					const price = card.prices.usd ? `$${card.prices.usd}` : "N/A";
					const image =
						card.image_uris?.normal ||
						card.card_faces?.[0]?.image_uris?.normal ||
						"No image";

					return {
						content: [
							{
								type: "text",
								text: `**Random Card: ${card.name}**

Mana Cost: ${card.mana_cost || "N/A"}
Type: ${card.type_line}
Set: ${card.set_name} (${card.set.toUpperCase()})

${card.oracle_text || "No oracle text"}

Price: ${price}
Image: ${image}
Scryfall: ${card.scryfall_uri}`,
							},
						],
					};
				} catch (error) {
					if (error instanceof ScryfallAPIError) {
						return {
							content: [
								{
									type: "text",
									text: `Error getting random card: ${error.details}`,
								},
							],
							isError: true,
						};
					}
					throw error;
				}
			},
		);

		// Register comprehensive search syntax documentation resource
		this.server.resource(
			"Scryfall Search Syntax - Complete Reference",
			"scryfall://search-syntax/full",
			{
				mimeType: "text/markdown",
				description:
					"Complete reference guide for constructing Scryfall search queries with all keywords, operators, and advanced filters",
			},
			async () => {
				return {
					contents: [
						{
							uri: "scryfall://search-syntax/full",
							mimeType: "text/markdown",
							text: searchSyntaxDoc,
						},
					],
				};
			},
		);

		// Register field reference resource
		this.server.resource(
			"Available Card Fields",
			"scryfall://fields/reference",
			{
				mimeType: "text/markdown",
				description:
					"Complete list of available fields for card data formatting with custom field arrays",
			},
			async () => {
				const fieldDoc = `# Available Card Fields

This reference lists all available fields you can use when requesting card data with custom field arrays.

## Field Groups

You can use predefined field groups for convenience:

### minimal
${FIELD_GROUP_MAPPINGS.minimal.map((f) => `- ${f}`).join("\n")}

### gameplay
${FIELD_GROUP_MAPPINGS.gameplay.map((f) => `- ${f}`).join("\n")}

### pricing
${FIELD_GROUP_MAPPINGS.pricing.map((f) => `- ${f}`).join("\n")}

### imagery
${FIELD_GROUP_MAPPINGS.imagery.map((f) => `- ${f}`).join("\n")}

### full
${FIELD_GROUP_MAPPINGS.full.map((f) => `- ${f}`).join("\n")}

## All Valid Fields

The predefined field group "full" contains all valid fields. 

## Usage Examples

### Using a predefined group:
\`\`\`
{ "fields": "minimal" }
\`\`\`

### Using a custom field array:
\`\`\`
{ "fields": ["name", "mana_cost", "prices"] }
\`\`\`

### Using nested fields:
\`\`\`
{ "fields": ["name", "prices.usd", "prices.eur"] }
\`\`\`

Note: Fields marked as objects (like "prices", "legalities", "image_uris") contain nested data. You can request the entire object or use dot notation for specific nested fields.
`;

				return {
					contents: [
						{
							uri: "scryfall://fields/reference",
							mimeType: "text/markdown",
							text: fieldDoc,
						},
					],
				};
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
