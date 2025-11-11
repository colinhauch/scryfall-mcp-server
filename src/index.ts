import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import searchSyntaxDoc from "../docs/scryfall-search-syntax.md";
import { ScryfallAPIError, ScryfallClient } from "./scryfall/client";
import { formatCard, formatCards } from "./scryfall/formatter.js";
import type { CardField, CardFieldGroup } from "./scryfall/types.js";
import { FIELD_GROUP_KEYS, FIELD_GROUP_MAPPINGS } from "./scryfall/types.js";

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
					.default("minimal")
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'pricing', 'imagery', 'full'). Defaults to 'minimal'. For a complete list of available fields, see the 'Available Card Fields' resource at scryfall://fields/reference",
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

					// Use the formatter with the specified (or default) fields
					// Returns all cards from the current page (up to 175)
					const formatted = formatCards(
						result.data,
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

		// Get detailed information for one or more cards by name
		this.server.tool(
			"get_card_details",
			{
				names: z
					.array(z.string())
					.max(75)
					.describe(
						"Array of card names to search for (can be a single card or multiple cards). Maximum 75 cards per request.",
					),
				set: z
					.string()
					.optional()
					.describe("Set code to filter by for all cards (e.g., 'mkm')"),
				fields: z
					.union([z.array(z.string()), z.enum(FIELD_GROUP_KEYS)])
					.default("gameplay")
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'pricing', 'imagery', 'full'). Defaults to 'gameplay'. For a complete list of available fields, see the 'Available Card Fields' resource at scryfall://fields/reference",
					),
			},
			async ({ names, set, fields }) => {
				try {
					// Build identifiers for the collection endpoint
					const identifiers = names.map((name) => {
						if (set) {
							return { name, set };
						}
						return { name };
					});

					// Use the collection endpoint (single API call for all cards)
					const result = await this.scryfallClient.getCollection(identifiers);

					// If no cards were found, return error
					if (result.data.length === 0) {
						const notFoundList = result.not_found
							? result.not_found
									.map((id) => {
										if ("name" in id) {
											return `"${id.name}"${id.set ? ` (${id.set})` : ""}`;
										}
										return JSON.stringify(id);
									})
									.join(", ")
							: "all requested cards";

						return {
							content: [
								{
									type: "text",
									text: `No cards found. Not found: ${notFoundList}`,
								},
							],
							isError: true,
						};
					}

					// Format the successful results
					const formatted = formatCards(
						result.data,
						fields as CardField[] | CardFieldGroup,
					);

					// Add error messages if some cards weren't found
					const errorSection =
						result.not_found && result.not_found.length > 0
							? `\n\n**Not found (${result.not_found.length}):**\n${result.not_found
									.map((id) => {
										if ("name" in id) {
											return `- "${id.name}"${id.set ? ` (${id.set})` : ""}`;
										}
										return `- ${JSON.stringify(id)}`;
									})
									.join("\n")}`
							: "";

					return {
						content: [
							{
								type: "text",
								text: `${formatted}${errorSection}`,
							},
						],
					};
				} catch (error) {
					if (error instanceof ScryfallAPIError) {
						return {
							content: [
								{
									type: "text",
									text: `Error fetching cards: ${error.details}`,
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
					.default("gameplay")
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'pricing', 'imagery', 'full'). Defaults to 'gameplay'. For a complete list of available fields, see the 'Available Card Fields' resource at scryfall://fields/reference",
					),
			},
			async ({ query, fields }) => {
				try {
					const card = await this.scryfallClient.getRandomCard(query);

					// Use the formatter with the specified (or default) fields
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
