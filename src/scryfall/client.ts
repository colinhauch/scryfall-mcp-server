/**
 * Scryfall API Client
 * Handles all interactions with the Scryfall REST API
 * https://scryfall.com/docs/api
 */

import type {
	ScryfallCard,
	ScryfallList,
	ScryfallSet,
	ScryfallSymbol,
	ScryfallCatalog,
	ScryfallError,
	CardIdentifier,
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
	maxRetries?: number; // Maximum number of retries for rate limit errors
	initialBackoff?: number; // Initial backoff time in ms for exponential backoff
}

export class ScryfallClient {
	private baseUrl: string;
	private userAgent: string;
	private lastRequestTime: number = 0;
	private requestDelay: number;
	private maxRetries: number;
	private initialBackoff: number;

	constructor(options: ScryfallClientOptions = {}) {
		this.baseUrl = options.baseUrl || "https://api.scryfall.com";
		this.userAgent = options.userAgent || "scryfall-mcp-server/0.0.0";
		this.requestDelay = options.requestDelay || 100; // 100ms default (Scryfall recommends 50-100ms)
		this.maxRetries = options.maxRetries || 3; // Default 3 retries for rate limit errors
		this.initialBackoff = options.initialBackoff || 1000; // 1 second initial backoff
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
	 * Sleep for a specified duration
	 */
	private async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Generic fetch method with error handling and retry logic
	 */
	private async fetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
		return this.fetchWithRetry<T>(endpoint, init, 0);
	}

	/**
	 * Internal fetch with exponential backoff retry logic
	 */
	private async fetchWithRetry<T>(
		endpoint: string,
		init: RequestInit | undefined,
		retryCount: number,
	): Promise<T> {
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

		// Handle HTTP 429 (Too Many Requests) with exponential backoff
		if (response.status === 429) {
			if (retryCount < this.maxRetries) {
				const backoffTime = this.initialBackoff * 2 ** retryCount;
				console.warn(
					`Rate limit hit (429). Retrying after ${backoffTime}ms (attempt ${retryCount + 1}/${this.maxRetries})`,
				);
				await this.sleep(backoffTime);
				return this.fetchWithRetry<T>(endpoint, init, retryCount + 1);
			}
			throw new ScryfallAPIError(
				"Rate limit exceeded and max retries reached",
				"rate_limit_error",
				429,
				"Too many requests. Please reduce request frequency.",
			);
		}

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
	 * Get all sets
	 */
	async getSets(): Promise<ScryfallList<ScryfallSet>> {
		return this.fetch<ScryfallList<ScryfallSet>>("/sets");
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

	/**
	 * Get a collection of cards by identifiers
	 * Maximum 75 identifiers per request
	 * https://scryfall.com/docs/api/cards/collection
	 */
	async getCollection(
		identifiers: CardIdentifier[],
	): Promise<ScryfallList<ScryfallCard>> {
		if (identifiers.length === 0) {
			throw new Error("At least one identifier is required");
		}

		if (identifiers.length > 75) {
			throw new Error(
				"Maximum 75 identifiers allowed per request. Use multiple requests for larger collections.",
			);
		}

		return this.fetch<ScryfallList<ScryfallCard>>("/cards/collection", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ identifiers }),
		});
	}
}
