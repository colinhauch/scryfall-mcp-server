/**
 * Scryfall API TypeScript types
 * Based on https://scryfall.com/docs/api
 */

export interface ScryfallError {
	object: "error";
	code: string;
	status: number;
	details: string;
}

export interface ScryfallCard {
	object: "card";
	id: string;
	oracle_id: string;
	name: string;
	lang: string;
	released_at: string;
	uri: string;
	scryfall_uri: string;
	layout: string;
	highres_image: boolean;
	image_status: "missing" | "placeholder" | "lowres" | "highres_scan";

	// Card faces (for double-sided cards)
	card_faces?: ScryfallCardFace[];

	// Imagery
	image_uris?: ScryfallImageUris;

	// Mana cost and colors
	mana_cost?: string;
	cmc: number;
	type_line: string;
	oracle_text?: string;
	colors?: string[];
	color_identity: string[];

	// Card stats
	power?: string;
	toughness?: string;
	loyalty?: string;

	// Legalities
	legalities: Record<string, "legal" | "not_legal" | "restricted" | "banned">;

	// Game information
	reserved: boolean;
	foil: boolean;
	nonfoil: boolean;

	// Print information
	set: string;
	set_name: string;
	set_type: string;
	set_uri: string;
	set_search_uri: string;
	scryfall_set_uri: string;
	rulings_uri: string;
	prints_search_uri: string;
	collector_number: string;
	digital: boolean;
	rarity: "common" | "uncommon" | "rare" | "mythic" | "special" | "bonus";

	// Flavor
	flavor_text?: string;
	artist?: string;
	artist_ids?: string[];
	illustration_id?: string;
	border_color: string;
	frame: string;

	// Prices
	prices: {
		usd?: string | null;
		usd_foil?: string | null;
		usd_etched?: string | null;
		eur?: string | null;
		eur_foil?: string | null;
		tix?: string | null;
	};

	// Related URIs
	related_uris: {
		gatherer?: string;
		tcgplayer_infinite_articles?: string;
		tcgplayer_infinite_decks?: string;
		edhrec?: string;
	};

	// Purchase URIs
	purchase_uris?: {
		tcgplayer?: string;
		cardmarket?: string;
		cardhoarder?: string;
	};
}

export interface ScryfallCardFace {
	object: "card_face";
	name: string;
	mana_cost: string;
	type_line: string;
	oracle_text?: string;
	colors?: string[];
	power?: string;
	toughness?: string;
	loyalty?: string;
	flavor_text?: string;
	artist?: string;
	artist_id?: string;
	illustration_id?: string;
	image_uris?: ScryfallImageUris;
}

export interface ScryfallImageUris {
	small: string;
	normal: string;
	large: string;
	png: string;
	art_crop: string;
	border_crop: string;
}

export interface ScryfallList<T> {
	object: "list";
	total_cards?: number;
	has_more: boolean;
	next_page?: string;
	data: T[];
	warnings?: string[];
}

export interface ScryfallSet {
	object: "set";
	id: string;
	code: string;
	name: string;
	uri: string;
	scryfall_uri: string;
	search_uri: string;
	released_at?: string;
	set_type: string;
	card_count: number;
	digital: boolean;
	nonfoil_only: boolean;
	foil_only: boolean;
	icon_svg_uri: string;
}

export interface ScryfallRuling {
	object: "ruling";
	oracle_id: string;
	source: string;
	published_at: string;
	comment: string;
}

export interface ScryfallSymbol {
	object: "card_symbol";
	symbol: string;
	loose_variant?: string;
	english: string;
	transposable: boolean;
	represents_mana: boolean;
	appears_in_mana_costs: boolean;
	cmc?: number;
	funny: boolean;
	colors: string[];
	gatherer_alternates?: string[];
	svg_uri?: string;
}

export interface ScryfallCatalog {
	object: "catalog";
	uri: string;
	total_values: number;
	data: string[];
}

export type ScryfallResponse<T> = T | ScryfallError;

export function isScryfallError(response: unknown): response is ScryfallError {
	return (
		typeof response === "object" &&
		response !== null &&
		"object" in response &&
		response.object === "error"
	);
}

/**
 * Field selection for card formatting
 */

// All available card fields that can be selected
export type CardField =
	| keyof ScryfallCard
	| "prices.usd"
	| "prices.usd_foil"
	| "prices.usd_etched"
	| "prices.eur"
	| "prices.eur_foil"
	| "prices.tix"
	| "image_uris.small"
	| "image_uris.normal"
	| "image_uris.large"
	| "image_uris.png"
	| "image_uris.art_crop"
	| "image_uris.border_crop";

// Predefined field groups for convenience
export type CardFieldGroup =
	| "minimal"
	| "gameplay"
	| "pricing"
	| "imagery"
	| "full";

// Mapping of field groups to their actual fields
export const FIELD_GROUP_MAPPINGS: Record<CardFieldGroup, CardField[]> = {
	minimal: ["name", "mana_cost", "type_line", "oracle_text"],
	gameplay: [
		"name",
		"card_faces",
		"mana_cost",
		"cmc",
		"type_line",
		"oracle_text",
		"colors",
		"color_identity",
		"power",
		"toughness",
		"loyalty",
		"legalities",
		"rarity",
	],
	pricing: ["name", "prices"],
	imagery: ["name", "artist", "image_uris", "illustration_id"],
	full: [
		"id",
		"name",
		"released_at",
		"layout",
		"card_faces",
		"mana_cost",
		"cmc",
		"type_line",
		"oracle_text",
		"colors",
		"color_identity",
		"power",
		"toughness",
		"loyalty",
		"legalities",
		"reserved",
		"set_name",
		"set_type",
		"collector_number",
		"digital",
		"rarity",
		"flavor_text",
		"artist",
		"frame",
		"prices",
	],
};

// Helper to get all field group keys for use in Zod schemas
export const FIELD_GROUP_KEYS = Object.keys(FIELD_GROUP_MAPPINGS) as [
	CardFieldGroup,
	...CardFieldGroup[],
];

// All valid field names - derived from the 'full' group for validation
export const ALL_VALID_FIELDS = FIELD_GROUP_MAPPINGS.full;

/**
 * Validate field names against the list of valid fields
 * @param fields - Array of field names to validate
 * @returns Object containing valid fields and warnings for invalid ones
 */
export function validateFields(fields: string[]): {
	valid: string[];
	warnings: string[];
} {
	const valid: string[] = [];
	const warnings: string[] = [];
	const validFieldSet = new Set(ALL_VALID_FIELDS);

	for (const field of fields) {
		if (validFieldSet.has(field as CardField)) {
			valid.push(field);
		} else {
			warnings.push(
				`Field '${field}' is not a recognized field. See scryfall://fields/reference for available fields.`,
			);
		}
	}

	return { valid, warnings };
}
