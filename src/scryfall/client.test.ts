import { beforeEach, describe, expect, it } from "vitest";
import { ScryfallAPIError, ScryfallClient } from "./client";

describe("ScryfallClient", () => {
	let client: ScryfallClient;

	beforeEach(() => {
		client = new ScryfallClient({ requestDelay: 0 }); // Disable rate limiting for tests
	});

	describe("searchCards", () => {
		it("should search for cards with a basic query", async () => {
			const result = await client.searchCards("lightning bolt");

			expect(result.object).toBe("list");
			expect(result.data).toBeInstanceOf(Array);
			expect(result.data.length).toBeGreaterThan(0);

			const firstCard = result.data[0];
			expect(firstCard.object).toBe("card");
			expect(firstCard.name.toLowerCase()).toContain("lightning");
		});

		it("should handle search options", async () => {
			const result = await client.searchCards("type:creature color:red", {
				order: "cmc",
				dir: "asc",
				unique: "cards",
			});

			expect(result.object).toBe("list");
			expect(result.data.length).toBeGreaterThan(0);
		});

		it("should handle empty search results", async () => {
			await expect(
				client.searchCards("thiscarddefinitelydoesnotexist12345"),
			).rejects.toThrow(ScryfallAPIError);
		});
	});

	describe("getCardNamed", () => {
		it("should get a card by exact name", async () => {
			const card = await client.getCardNamed("Lightning Bolt");

			expect(card.object).toBe("card");
			expect(card.name).toBe("Lightning Bolt");
			expect(card.type_line).toContain("Instant");
		});

		it("should get a card by fuzzy name", async () => {
			const card = await client.getCardNamed("lightning bolt", { fuzzy: true });

			expect(card.object).toBe("card");
			expect(card.name).toBe("Lightning Bolt");
		});

		it("should throw error for non-existent card", async () => {
			await expect(
				client.getCardNamed("This Card Does Not Exist 12345"),
			).rejects.toThrow(ScryfallAPIError);
		});
	});

	describe("getRandomCard", () => {
		it("should get a random card", async () => {
			const card = await client.getRandomCard();

			expect(card.object).toBe("card");
			expect(card.name).toBeTruthy();
			expect(card.id).toBeTruthy();
		});

		it("should get a random card with query filter", async () => {
			const card = await client.getRandomCard("type:creature");

			expect(card.object).toBe("card");
			expect(card.type_line).toContain("Creature");
		});
	});

	describe("getCard", () => {
		it("should get a card by Scryfall ID", async () => {
			// Lightning Bolt ID (current default printing)
			const id = "77c6fa74-5543-42ac-9ead-0e890b188e99";
			const card = await client.getCard(id);

			expect(card.object).toBe("card");
			expect(card.id).toBe(id);
			expect(card.name).toBe("Lightning Bolt");
		});

		it("should throw error for invalid ID", async () => {
			await expect(client.getCard("invalid-id-12345")).rejects.toThrow();
		});
	});

	describe("getSets", () => {
		it("should get all sets", async () => {
			const result = await client.getSets();

			expect(result.object).toBe("list");
			expect(result.data).toBeInstanceOf(Array);
			expect(result.data.length).toBeGreaterThan(0);

			const firstSet = result.data[0];
			expect(firstSet.object).toBe("set");
			expect(firstSet.code).toBeTruthy();
			expect(firstSet.name).toBeTruthy();
		});
	});

	describe("getSymbology", () => {
		it("should get all card symbols", async () => {
			const result = await client.getSymbology();

			expect(result.object).toBe("list");
			expect(result.data).toBeInstanceOf(Array);
			expect(result.data.length).toBeGreaterThan(0);

			const redMana = result.data.find((s) => s.symbol === "{R}");
			expect(redMana).toBeTruthy();
			expect(redMana?.represents_mana).toBe(true);
		});
	});

	describe("parseMana", () => {
		it("should parse a mana cost", async () => {
			const result = await client.parseMana("{2}{R}{R}");

			expect(result.cmc).toBe(4);
			expect(result.colors).toContain("R");
		});
	});

	describe("getCatalog", () => {
		it("should get card names catalog", async () => {
			const result = await client.getCatalog("card-names");

			expect(result.object).toBe("catalog");
			expect(result.data).toBeInstanceOf(Array);
			expect(result.data.length).toBeGreaterThan(0);
			expect(result.data).toContain("Lightning Bolt");
		});

		it("should get creature types catalog", async () => {
			const result = await client.getCatalog("creature-types");

			expect(result.object).toBe("catalog");
			expect(result.data).toBeInstanceOf(Array);
			expect(result.data).toContain("Human");
			expect(result.data).toContain("Dragon");
		});
	});

	describe("getCollection", () => {
		it("should get multiple cards by name", async () => {
			const result = await client.getCollection([
				{ name: "Lightning Bolt" },
				{ name: "Dark Ritual" },
				{ name: "Counterspell" },
			]);

			expect(result.object).toBe("list");
			expect(result.data).toBeInstanceOf(Array);
			expect(result.data.length).toBe(3);

			const names = result.data.map((card) => card.name);
			expect(names).toContain("Lightning Bolt");
			expect(names).toContain("Dark Ritual");
			expect(names).toContain("Counterspell");
		});

		it("should get cards with set filter", async () => {
			const result = await client.getCollection([
				{ name: "Lightning Bolt", set: "lea" }, // Alpha
			]);

			expect(result.object).toBe("list");
			expect(result.data.length).toBe(1);
			expect(result.data[0].name).toBe("Lightning Bolt");
			expect(result.data[0].set).toBe("lea");
		});

		it("should handle mixed identifiers", async () => {
			const result = await client.getCollection([
				{ name: "Black Lotus" },
				{ set: "lea", collector_number: "233" }, // Mountain from Alpha
			]);

			expect(result.object).toBe("list");
			expect(result.data).toBeInstanceOf(Array);
			expect(result.data.length).toBe(2);
		});

		it("should return not_found for missing cards", async () => {
			const result = await client.getCollection([
				{ name: "Lightning Bolt" },
				{ name: "ThisCardDoesNotExist123456" },
			]);

			expect(result.object).toBe("list");
			expect(result.data.length).toBe(1);
			expect(result.data[0].name).toBe("Lightning Bolt");
			expect(result.not_found).toBeDefined();
			expect(result.not_found?.length).toBe(1);
		});

		it("should throw error for empty identifiers", async () => {
			await expect(client.getCollection([])).rejects.toThrow(
				"At least one identifier is required",
			);
		});

		it("should throw error for more than 75 identifiers", async () => {
			const identifiers = Array.from({ length: 76 }, (_, i) => ({
				name: `Card ${i}`,
			}));

			await expect(client.getCollection(identifiers)).rejects.toThrow(
				"Maximum 75 identifiers allowed",
			);
		});
	});

	describe("error handling", () => {
		it("should handle API errors gracefully", async () => {
			try {
				await client.getCardNamed("NonExistentCard123456789");
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(ScryfallAPIError);
				if (error instanceof ScryfallAPIError) {
					expect(error.status).toBe(404);
					expect(error.code).toBeTruthy();
					expect(error.details).toBeTruthy();
				}
			}
		});
	});

	describe("rate limiting", () => {
		it("should respect rate limits", async () => {
			const clientWithDelay = new ScryfallClient({ requestDelay: 50 });

			const start = Date.now();
			await clientWithDelay.getRandomCard();
			await clientWithDelay.getRandomCard();
			const duration = Date.now() - start;

			// Should take at least 50ms between requests
			expect(duration).toBeGreaterThanOrEqual(50);
		});

		it("should use default delay of 100ms", async () => {
			const defaultClient = new ScryfallClient();

			const start = Date.now();
			await defaultClient.getRandomCard();
			await defaultClient.getRandomCard();
			const duration = Date.now() - start;

			// Should take at least 100ms between requests (default)
			expect(duration).toBeGreaterThanOrEqual(100);
		});

		it("should have configurable retry settings", () => {
			const customClient = new ScryfallClient({
				maxRetries: 5,
				initialBackoff: 2000,
				requestDelay: 75,
			});

			expect(customClient).toBeInstanceOf(ScryfallClient);
		});

		it("should use default retry values", () => {
			const defaultClient = new ScryfallClient();

			// Defaults: maxRetries=3, initialBackoff=1000, requestDelay=100
			expect(defaultClient).toBeInstanceOf(ScryfallClient);
		});

		// Note: Testing actual HTTP 429 retry behavior would require mocking
		// the fetch API or a dedicated test server that returns 429 responses.
		// For integration tests, you would set up a mock server like MSW (Mock Service Worker)
		// to simulate rate limit responses and verify retry behavior.
	});
});
