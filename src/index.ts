import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ScryfallClient, ScryfallAPIError } from "./scryfall/client";
import { formatCard, formatCards } from "./scryfall/formatter.js";
import type { CardField, CardFieldGroup } from "./scryfall/types.js";

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
				query: z
					.string()
					.describe(
						"Scryfall search query (e.g., 'lightning bolt', 'type:creature color:red')",
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
						"tix",
						"eur",
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
					.union([
						z.array(z.string()),
						z.enum([
							"minimal",
							"gameplay",
							"print",
							"pricing",
							"imagery",
							"full",
						]),
					])
					.optional()
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'print', 'pricing', 'imagery', 'full')",
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
					.union([
						z.array(z.string()),
						z.enum([
							"minimal",
							"gameplay",
							"print",
							"pricing",
							"imagery",
							"full",
						]),
					])
					.optional()
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'print', 'pricing', 'imagery', 'full')",
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
					.union([
						z.array(z.string()),
						z.enum([
							"minimal",
							"gameplay",
							"print",
							"pricing",
							"imagery",
							"full",
						]),
					])
					.optional()
					.describe(
						"Optional field selection - either an array of field names (e.g., ['name', 'mana_cost', 'prices']) or a predefined group ('minimal', 'gameplay', 'print', 'pricing', 'imagery', 'full')",
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
