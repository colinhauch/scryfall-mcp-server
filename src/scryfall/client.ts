/**
 * Scryfall API Client
 * Handles all interactions with the Scryfall REST API
 * https://scryfall.com/docs/api
 */

import type {
	ScryfallCard,
	ScryfallList,
	ScryfallSet,
	ScryfallRuling,
	ScryfallSymbol,
	ScryfallCatalog,
	ScryfallError,
} from "./types";
import { isScryfallError } from "./types";

export class ScryfallAPIError extends Error {
	constructor(
		message: string,
		public code: string,
		public status: number,
		public details: string,
	) {
		super(message);
		this.name = "ScryfallAPIError";
	}

	static fromScryfallError(error: ScryfallError): ScryfallAPIError {
		return new ScryfallAPIError(
			`Scryfall API Error: ${error.details}`,
			error.code,
			error.status,
			error.details,
		);
	}
}

export interface ScryfallClientOptions {
	baseUrl?: string;
	userAgent?: string;
	requestDelay?: number; // Scryfall asks for 50-100ms between requests
}

export class ScryfallClient {
	private baseUrl: string;
	private userAgent: string;
	private lastRequestTime: number = 0;
	private requestDelay: number;

	constructor(options: ScryfallClientOptions = {}) {
		this.baseUrl = options.baseUrl || "https://api.scryfall.com";
		this.userAgent = options.userAgent || "scryfall-mcp-server/0.0.0";
		this.requestDelay = options.requestDelay || 100; // 100ms default
	}

	/**
	 * Rate limiting: Scryfall requests 50-100ms between requests
	 */
	private async respectRateLimit(): Promise<void> {
		const now = Date.now();
		const timeSinceLastRequest = now - this.lastRequestTime;

		if (timeSinceLastRequest < this.requestDelay) {
			await new Promise((resolve) =>
				setTimeout(resolve, this.requestDelay - timeSinceLastRequest),
			);
		}

		this.lastRequestTime = Date.now();
	}

	/**
	 * Generic fetch method with error handling
	 */
	private async fetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
		await this.respectRateLimit();

		const url = endpoint.startsWith("http")
			? endpoint
			: `${this.baseUrl}${endpoint}`;

		const response = await fetch(url, {
			...init,
			headers: {
				"User-Agent": this.userAgent,
				Accept: "application/json",
				...init?.headers,
			},
		});

		const data = await response.json();

		if (isScryfallError(data)) {
			throw ScryfallAPIError.fromScryfallError(data);
		}

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return data as T;
	}

	/**
	 * Search for cards using Scryfall's search syntax
	 * https://scryfall.com/docs/syntax
	 */
	async searchCards(
		query: string,
		options: {
			unique?: "cards" | "art" | "prints";
			order?:
				| "name"
				| "set"
				| "released"
				| "rarity"
				| "color"
				| "usd"
				| "tix"
				| "eur"
				| "cmc"
				| "power"
				| "toughness"
				| "edhrec"
				| "penny"
				| "artist"
				| "review";
			dir?: "auto" | "asc" | "desc";
			include_extras?: boolean;
			include_multilingual?: boolean;
			include_variations?: boolean;
			page?: number;
		} = {},
	): Promise<ScryfallList<ScryfallCard>> {
		const params = new URLSearchParams({ q: query });

		if (options.unique) params.set("unique", options.unique);
		if (options.order) params.set("order", options.order);
		if (options.dir) params.set("dir", options.dir);
		if (options.include_extras !== undefined)
			params.set("include_extras", String(options.include_extras));
		if (options.include_multilingual !== undefined)
			params.set("include_multilingual", String(options.include_multilingual));
		if (options.include_variations !== undefined)
			params.set("include_variations", String(options.include_variations));
		if (options.page !== undefined) params.set("page", String(options.page));

		return this.fetch<ScryfallList<ScryfallCard>>(
			`/cards/search?${params.toString()}`,
		);
	}

	/**
	 * Get a card by exact name
	 */
	async getCardNamed(
		name: string,
		options: { fuzzy?: boolean; set?: string } = {},
	): Promise<ScryfallCard> {
		const params = new URLSearchParams();

		if (options.fuzzy) {
			params.set("fuzzy", name);
		} else {
			params.set("exact", name);
		}

		if (options.set) {
			params.set("set", options.set);
		}

		return this.fetch<ScryfallCard>(`/cards/named?${params.toString()}`);
	}

	/**
	 * Get a card by Scryfall ID
	 */
	async getCard(id: string): Promise<ScryfallCard> {
		return this.fetch<ScryfallCard>(`/cards/${id}`);
	}

	/**
	 * Get a random card
	 */
	async getRandomCard(query?: string): Promise<ScryfallCard> {
		const params = query
			? new URLSearchParams({ q: query })
			: new URLSearchParams();
		return this.fetch<ScryfallCard>(`/cards/random?${params.toString()}`);
	}

	/**
	 * Get autocomplete suggestions for card names
	 */
	async autocomplete(
		query: string,
		include_extras: boolean = false,
	): Promise<ScryfallCatalog> {
		const params = new URLSearchParams({ q: query });
		if (include_extras) {
			params.set("include_extras", "true");
		}
		return this.fetch<ScryfallCatalog>(
			`/cards/autocomplete?${params.toString()}`,
		);
	}

	/**
	 * Get all sets
	 */
	async getSets(): Promise<ScryfallList<ScryfallSet>> {
		return this.fetch<ScryfallList<ScryfallSet>>("/sets");
	}

	/**
	 * Get a specific set by code
	 */
	async getSet(code: string): Promise<ScryfallSet> {
		return this.fetch<ScryfallSet>(`/sets/${code}`);
	}

	/**
	 * Get rulings for a card
	 */
	async getRulings(cardId: string): Promise<ScryfallList<ScryfallRuling>> {
		return this.fetch<ScryfallList<ScryfallRuling>>(`/cards/${cardId}/rulings`);
	}

	/**
	 * Get all card symbols
	 */
	async getSymbology(): Promise<ScryfallList<ScryfallSymbol>> {
		return this.fetch<ScryfallList<ScryfallSymbol>>("/symbology");
	}

	/**
	 * Parse mana cost
	 */
	async parseMana(
		cost: string,
	): Promise<{ cost: string; cmc: number; colors: string[] }> {
		const params = new URLSearchParams({ cost });
		return this.fetch(`/symbology/parse-mana?${params.toString()}`);
	}

	/**
	 * Get catalog of values (card names, artist names, etc.)
	 */
	async getCatalog(
		catalogType:
			| "card-names"
			| "artist-names"
			| "word-bank"
			| "creature-types"
			| "planeswalker-types"
			| "land-types"
			| "artifact-types"
			| "enchantment-types"
			| "spell-types"
			| "powers"
			| "toughnesses"
			| "loyalties"
			| "watermarks"
			| "keyword-abilities"
			| "keyword-actions"
			| "ability-words",
	): Promise<ScryfallCatalog> {
		return this.fetch<ScryfallCatalog>(`/catalog/${catalogType}`);
	}
}
