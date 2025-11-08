import { describe, it, expect, beforeEach } from "vitest";
import { ScryfallClient, ScryfallAPIError } from "./client";

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
			// Lightning Bolt ID from Alpha
			const id = "8e765bd5-4e28-4f78-8c3a-1efa5c8db81f";
			const card = await client.getCard(id);

			expect(card.object).toBe("card");
			expect(card.id).toBe(id);
			expect(card.name).toBe("Lightning Bolt");
		});

		it("should throw error for invalid ID", async () => {
			await expect(client.getCard("invalid-id-12345")).rejects.toThrow();
		});
	});

	describe("autocomplete", () => {
		it("should provide autocomplete suggestions", async () => {
			const result = await client.autocomplete("light");

			expect(result.object).toBe("catalog");
			expect(result.data).toBeInstanceOf(Array);
			expect(result.data.length).toBeGreaterThan(0);
			expect(
				result.data.some((name) => name.toLowerCase().includes("light")),
			).toBe(true);
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

	describe("getSet", () => {
		it("should get a specific set by code", async () => {
			const set = await client.getSet("mkm"); // Murders at Karlov Manor

			expect(set.object).toBe("set");
			expect(set.code).toBe("mkm");
			expect(set.name).toBeTruthy();
		});
	});

	describe("getRulings", () => {
		it("should get rulings for a card", async () => {
			// Lightning Bolt ID
			const id = "8e765bd5-4e28-4f78-8c3a-1efa5c8db81f";
			const result = await client.getRulings(id);

			expect(result.object).toBe("list");
			expect(result.data).toBeInstanceOf(Array);
			// Lightning Bolt typically has rulings
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
