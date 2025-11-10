import { describe, it, expect } from "vitest";
import { formatCard, formatCards } from "./formatter.js";
import type { ScryfallCard } from "./types.js";

// Mock card data for testing
const mockSingleFacedCard: ScryfallCard = {
	object: "card",
	id: "test-id-1",
	oracle_id: "oracle-id-1",
	name: "Lightning Bolt",
	lang: "en",
	released_at: "1993-08-05",
	uri: "https://api.scryfall.com/cards/test-id-1",
	scryfall_uri: "https://scryfall.com/card/test-id-1",
	layout: "normal",
	highres_image: true,
	image_status: "highres_scan",
	mana_cost: "{R}",
	cmc: 1,
	type_line: "Instant",
	oracle_text: "Lightning Bolt deals 3 damage to any target.",
	colors: ["R"],
	color_identity: ["R"],
	legalities: {
		standard: "not_legal",
		modern: "legal",
		legacy: "legal",
		vintage: "legal",
	},
	reserved: false,
	foil: true,
	nonfoil: true,
	set: "lea",
	set_name: "Limited Edition Alpha",
	set_type: "core",
	set_uri: "https://api.scryfall.com/sets/lea",
	set_search_uri: "https://api.scryfall.com/cards/search?set=lea",
	scryfall_set_uri: "https://scryfall.com/sets/lea",
	rulings_uri: "https://api.scryfall.com/cards/test-id-1/rulings",
	prints_search_uri: "https://api.scryfall.com/cards/search?q=lightning+bolt",
	collector_number: "161",
	digital: false,
	rarity: "common",
	artist: "Christopher Rush",
	artist_ids: ["artist-id-1"],
	illustration_id: "illustration-id-1",
	border_color: "black",
	frame: "1993",
	prices: {
		usd: "125.00",
		usd_foil: null,
		usd_etched: null,
		eur: "100.00",
		eur_foil: null,
		tix: null,
	},
	related_uris: {
		gatherer:
			"https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=1",
		edhrec: "https://edhrec.com/route/?cc=Lightning+Bolt",
	},
	image_uris: {
		small: "https://cards.scryfall.io/small/test-id-1.jpg",
		normal: "https://cards.scryfall.io/normal/test-id-1.jpg",
		large: "https://cards.scryfall.io/large/test-id-1.jpg",
		png: "https://cards.scryfall.io/png/test-id-1.png",
		art_crop: "https://cards.scryfall.io/art_crop/test-id-1.jpg",
		border_crop: "https://cards.scryfall.io/border_crop/test-id-1.jpg",
	},
};

const mockDoubleFacedCard: ScryfallCard = {
	object: "card",
	id: "test-id-2",
	oracle_id: "oracle-id-2",
	name: "Delver of Secrets // Insectile Aberration",
	lang: "en",
	released_at: "2011-09-30",
	uri: "https://api.scryfall.com/cards/test-id-2",
	scryfall_uri: "https://scryfall.com/card/test-id-2",
	layout: "transform",
	highres_image: true,
	image_status: "highres_scan",
	cmc: 1,
	type_line: "Creature — Human Wizard // Creature — Human Insect",
	color_identity: ["U"],
	legalities: {
		standard: "not_legal",
		modern: "legal",
		legacy: "legal",
		vintage: "legal",
	},
	reserved: false,
	foil: true,
	nonfoil: true,
	set: "isd",
	set_name: "Innistrad",
	set_type: "expansion",
	set_uri: "https://api.scryfall.com/sets/isd",
	set_search_uri: "https://api.scryfall.com/cards/search?set=isd",
	scryfall_set_uri: "https://scryfall.com/sets/isd",
	rulings_uri: "https://api.scryfall.com/cards/test-id-2/rulings",
	prints_search_uri: "https://api.scryfall.com/cards/search?q=delver",
	collector_number: "51",
	digital: false,
	rarity: "common",
	border_color: "black",
	frame: "2003",
	prices: {
		usd: "1.25",
		usd_foil: "5.00",
		usd_etched: null,
		eur: "1.00",
		eur_foil: "4.00",
		tix: "0.50",
	},
	related_uris: {
		gatherer:
			"https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=2",
		edhrec: "https://edhrec.com/route/?cc=Delver+of+Secrets",
	},
	card_faces: [
		{
			object: "card_face",
			name: "Delver of Secrets",
			mana_cost: "{U}",
			type_line: "Creature — Human Wizard",
			oracle_text:
				"At the beginning of your upkeep, look at the top card of your library. You may reveal that card. If an instant or sorcery card is revealed this way, transform Delver of Secrets.",
			colors: ["U"],
			power: "1",
			toughness: "1",
			artist: "Nils Hamm",
			artist_id: "artist-id-2",
			illustration_id: "illustration-id-2a",
			image_uris: {
				small: "https://cards.scryfall.io/small/test-id-2a.jpg",
				normal: "https://cards.scryfall.io/normal/test-id-2a.jpg",
				large: "https://cards.scryfall.io/large/test-id-2a.jpg",
				png: "https://cards.scryfall.io/png/test-id-2a.png",
				art_crop: "https://cards.scryfall.io/art_crop/test-id-2a.jpg",
				border_crop: "https://cards.scryfall.io/border_crop/test-id-2a.jpg",
			},
		},
		{
			object: "card_face",
			name: "Insectile Aberration",
			mana_cost: "",
			type_line: "Creature — Human Insect",
			oracle_text: "Flying",
			colors: ["U"],
			power: "3",
			toughness: "2",
			artist: "Nils Hamm",
			artist_id: "artist-id-2",
			illustration_id: "illustration-id-2b",
			image_uris: {
				small: "https://cards.scryfall.io/small/test-id-2b.jpg",
				normal: "https://cards.scryfall.io/normal/test-id-2b.jpg",
				large: "https://cards.scryfall.io/large/test-id-2b.jpg",
				png: "https://cards.scryfall.io/png/test-id-2b.png",
				art_crop: "https://cards.scryfall.io/art_crop/test-id-2b.jpg",
				border_crop: "https://cards.scryfall.io/border_crop/test-id-2b.jpg",
			},
		},
	],
};

const mockCreature: ScryfallCard = {
	object: "card",
	id: "test-id-3",
	oracle_id: "oracle-id-3",
	name: "Tarmogoyf",
	lang: "en",
	released_at: "2007-05-04",
	uri: "https://api.scryfall.com/cards/test-id-3",
	scryfall_uri: "https://scryfall.com/card/test-id-3",
	layout: "normal",
	highres_image: true,
	image_status: "highres_scan",
	mana_cost: "{1}{G}",
	cmc: 2,
	type_line: "Creature — Lhurgoyf",
	oracle_text:
		"Tarmogoyf's power is equal to the number of card types among cards in all graveyards and its toughness is equal to that number plus 1.",
	colors: ["G"],
	color_identity: ["G"],
	power: "*",
	toughness: "*+1",
	legalities: {
		standard: "not_legal",
		modern: "legal",
		legacy: "legal",
		vintage: "legal",
	},
	reserved: false,
	foil: true,
	nonfoil: true,
	set: "fut",
	set_name: "Future Sight",
	set_type: "expansion",
	set_uri: "https://api.scryfall.com/sets/fut",
	set_search_uri: "https://api.scryfall.com/cards/search?set=fut",
	scryfall_set_uri: "https://scryfall.com/sets/fut",
	rulings_uri: "https://api.scryfall.com/cards/test-id-3/rulings",
	prints_search_uri: "https://api.scryfall.com/cards/search?q=tarmogoyf",
	collector_number: "153",
	digital: false,
	rarity: "rare",
	artist: "Ryan Barger",
	artist_ids: ["artist-id-3"],
	illustration_id: "illustration-id-3",
	border_color: "black",
	frame: "future",
	prices: {
		usd: "15.00",
		usd_foil: "45.00",
		usd_etched: null,
		eur: "12.00",
		eur_foil: "40.00",
		tix: "5.00",
	},
	related_uris: {
		gatherer:
			"https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=3",
		edhrec: "https://edhrec.com/route/?cc=Tarmogoyf",
	},
	image_uris: {
		small: "https://cards.scryfall.io/small/test-id-3.jpg",
		normal: "https://cards.scryfall.io/normal/test-id-3.jpg",
		large: "https://cards.scryfall.io/large/test-id-3.jpg",
		png: "https://cards.scryfall.io/png/test-id-3.png",
		art_crop: "https://cards.scryfall.io/art_crop/test-id-3.jpg",
		border_crop: "https://cards.scryfall.io/border_crop/test-id-3.jpg",
	},
};

describe("formatCard", () => {
	describe("with custom field arrays", () => {
		it("formats a single field correctly", () => {
			const result = formatCard(mockSingleFacedCard, ["name"]);
			expect(result).toBe("**Lightning Bolt**\n");
		});

		it("formats multiple basic fields correctly", () => {
			const result = formatCard(mockSingleFacedCard, [
				"name",
				"mana_cost",
				"type_line",
			]);
			expect(result).toContain("**Lightning Bolt**");
			expect(result).toContain("mana_cost: {R}");
			expect(result).toContain("type_line: Instant");
		});

		it("formats nested price fields correctly", () => {
			const result = formatCard(mockSingleFacedCard, ["name", "prices.usd"]);
			expect(result).toContain("**Lightning Bolt**");
			expect(result).toContain("prices.usd: 125.00");
		});

		it("formats creature stats correctly", () => {
			const result = formatCard(mockCreature, ["name", "power", "toughness"]);
			expect(result).toContain("**Tarmogoyf**");
			expect(result).toContain("power: *");
			expect(result).toContain("toughness: *+1");
		});

		it("handles array fields correctly", () => {
			const result = formatCard(mockSingleFacedCard, ["name", "colors"]);
			expect(result).toContain("**Lightning Bolt**");
			expect(result).toContain("colors: R");
		});

		it("handles object fields correctly", () => {
			const result = formatCard(mockSingleFacedCard, ["name", "legalities"]);
			expect(result).toContain("**Lightning Bolt**");
			expect(result).toContain("legalities:");
			// Should be formatted as JSON
			expect(result).toMatch(/"standard":\s*"not_legal"/);
		});

		it("handles missing/null fields gracefully", () => {
			const result = formatCard(mockSingleFacedCard, [
				"name",
				"power",
				"toughness",
			]);
			// Lightning Bolt has no power/toughness
			expect(result).toContain("**Lightning Bolt**");
			expect(result).not.toContain("power:");
			expect(result).not.toContain("toughness:");
		});
	});

	describe("with predefined groups", () => {
		it("formats with minimal group", () => {
			const result = formatCard(mockSingleFacedCard, "minimal");
			expect(result).toContain("**Lightning Bolt**");
			expect(result).toContain("mana_cost: {R}");
			expect(result).toContain("type_line: Instant");
			expect(result).toContain(
				"oracle_text: Lightning Bolt deals 3 damage to any target.",
			);
			// Should not contain set info
			expect(result).not.toContain("set:");
		});

		it("formats with gameplay group", () => {
			const result = formatCard(mockCreature, "gameplay");
			expect(result).toContain("**Tarmogoyf**");
			expect(result).toContain("mana_cost: {1}{G}");
			expect(result).toContain("power: *");
			expect(result).toContain("toughness: *+1");
			expect(result).toContain("colors: G");
			expect(result).toContain("legalities:");
		});

		it("formats with full group", () => {
			const result = formatCard(mockSingleFacedCard, "full");
			expect(result).toContain("**Lightning Bolt**");
			expect(result).toContain("id: test-id-1");
			expect(result).toContain("set_name: Limited Edition Alpha");
			expect(result).toContain("rarity: common");
			expect(result).toContain("collector_number: 161");
			expect(result).toContain("artist: Christopher Rush");
		});

		it("formats with pricing group", () => {
			const result = formatCard(mockSingleFacedCard, "pricing");
			expect(result).toContain("**Lightning Bolt**");
			expect(result).toContain("prices:");
			expect(result).toMatch(/"usd":\s*"125\.00"/);
		});

		it("formats with imagery group", () => {
			const result = formatCard(mockSingleFacedCard, "imagery");
			expect(result).toContain("**Lightning Bolt**");
			expect(result).toContain("image_uris:");
			expect(result).toContain("illustration_id: illustration-id-1");
		});
	});

	describe("with double-faced cards", () => {
		it("formats both faces with minimal fields", () => {
			const result = formatCard(mockDoubleFacedCard, "minimal");
			expect(result).toContain("**Delver of Secrets // Insectile Aberration**");
			expect(result).toContain("Face: Delver of Secrets");
			expect(result).toContain("Face: Insectile Aberration");
			expect(result).toContain("mana_cost: {U}");
			expect(result).toContain("type_line: Creature — Human Wizard");
			expect(result).toContain("type_line: Creature — Human Insect");
			// Minimal doesn't include power/toughness
			expect(result).not.toContain("power:");
			expect(result).not.toContain("toughness:");
		});

		it("formats both faces with gameplay fields including power/toughness", () => {
			const result = formatCard(mockDoubleFacedCard, "gameplay");
			expect(result).toContain("**Delver of Secrets // Insectile Aberration**");
			expect(result).toContain("Face: Delver of Secrets");
			expect(result).toContain("power: 1");
			expect(result).toContain("toughness: 1");
			expect(result).toContain("Face: Insectile Aberration");
			expect(result).toContain("power: 3");
			expect(result).toContain("toughness: 2");
		});

		it("includes card-level properties for double-faced cards", () => {
			const result = formatCard(mockDoubleFacedCard, "full");
			expect(result).toContain("Card Properties:");
			expect(result).toContain("id: test-id-2");
			expect(result).toContain("rarity: common");
		});

		it("formats custom fields for double-faced cards", () => {
			const result = formatCard(mockDoubleFacedCard, [
				"name",
				"power",
				"toughness",
				"set",
			]);
			expect(result).toContain("**Delver of Secrets // Insectile Aberration**");
			expect(result).toContain("Face: Delver of Secrets");
			expect(result).toContain("power: 1");
			expect(result).toContain("Card Properties:");
			expect(result).toContain("set: isd");
		});
	});

	describe("without field selection", () => {
		it("returns empty string when no fields specified", () => {
			const result = formatCard(mockSingleFacedCard);
			expect(result).toBe("");
		});
	});
});

describe("formatCards", () => {
	const mockCards = [mockSingleFacedCard, mockCreature, mockDoubleFacedCard];

	it("formats multiple cards with minimal fields", () => {
		const result = formatCards(mockCards, "minimal");
		expect(result).toContain("Showing 3 of 3 cards");
		expect(result).toContain("**Lightning Bolt**");
		expect(result).toContain("**Tarmogoyf**");
		expect(result).toContain("**Delver of Secrets // Insectile Aberration**");
		expect(result).toContain("---");
	});

	it("formats multiple cards with custom fields", () => {
		const result = formatCards(mockCards, ["name", "mana_cost", "prices.usd"]);
		expect(result).toContain("**Lightning Bolt**");
		expect(result).toContain("mana_cost: {R}");
		expect(result).toContain("prices.usd: 125.00");
		expect(result).toContain("**Tarmogoyf**");
		expect(result).toContain("mana_cost: {1}{G}");
		expect(result).toContain("prices.usd: 15.00");
	});

	it("respects the limit parameter", () => {
		const manyCards = Array(20).fill(mockSingleFacedCard);
		const result = formatCards(manyCards, "minimal", 5);
		expect(result).toContain("Showing 5 of 20 cards");
		expect(result).toContain("... and 15 more cards");
	});

	it("uses default limit of 10", () => {
		const manyCards = Array(15).fill(mockSingleFacedCard);
		const result = formatCards(manyCards, "minimal");
		expect(result).toContain("Showing 10 of 15 cards");
		expect(result).toContain("... and 5 more cards");
	});

	it("doesn't show 'more cards' message when under limit", () => {
		const result = formatCards(mockCards, "minimal", 10);
		expect(result).toContain("Showing 3 of 3 cards");
		expect(result).not.toContain("more cards");
	});

	it("returns empty string when no fields specified", () => {
		const result = formatCards(mockCards);
		expect(result).toBe("");
	});
});
