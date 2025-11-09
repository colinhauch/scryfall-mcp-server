/**
 * Utility for formatting Scryfall card data with optional field selection
 */

import type {
	CardField,
	CardFieldGroup,
	ScryfallCard,
	ScryfallCardFace,
} from "./types.js";
import { FIELD_GROUP_MAPPINGS } from "./types.js";

/**
 * Get the value from a card object given a field path (supports nested like "prices.usd")
 */
function getFieldValue(card: ScryfallCard, field: CardField): unknown {
	// Handle nested field paths
	if (field.includes(".")) {
		const parts = field.split(".");
		let value: unknown = card;
		for (const part of parts) {
			if (value && typeof value === "object" && part in value) {
				value = (value as Record<string, unknown>)[part];
			} else {
				return undefined;
			}
		}
		return value;
	}

	// Handle direct field access
	return card[field as keyof ScryfallCard];
}

/**
 * Format a single field value for text output
 */
function formatFieldValue(_field: CardField, value: unknown): string {
	if (value === undefined || value === null) {
		return "N/A";
	}

	// Handle arrays
	if (Array.isArray(value)) {
		return value.join(", ");
	}

	// Handle objects (like legalities, prices, image_uris)
	if (typeof value === "object") {
		return JSON.stringify(value, null, 2);
	}

	// Handle primitives
	return String(value);
}

/**
 * Resolve field selection to an array of field names
 */
function resolveFields(
	fields?: CardField[] | CardFieldGroup,
): CardField[] | undefined {
	if (!fields) {
		return undefined;
	}

	// If it's a string, it's a group name
	if (typeof fields === "string") {
		return FIELD_GROUP_MAPPINGS[fields];
	}

	// Otherwise it's already an array
	return fields;
}

/**
 * Format a card face (for multi-faced cards) with selected fields
 */
function formatCardFace(face: ScryfallCardFace, fields: CardField[]): string {
	const faceData: string[] = [];

	for (const field of fields) {
		// Map card fields to card face fields where applicable
		const faceField = field as keyof ScryfallCardFace;
		if (faceField in face) {
			const value = face[faceField];
			if (value !== undefined && value !== null && value !== "") {
				faceData.push(`  ${field}: ${formatFieldValue(field, value)}`);
			}
		}
	}

	return faceData.join("\n");
}

/**
 * Format a card with optional field selection
 * @param card - The Scryfall card object
 * @param fields - Optional array of fields to include, or a predefined group name
 * @returns Formatted string representation of the card
 */
export function formatCard(
	card: ScryfallCard,
	fields?: CardField[] | CardFieldGroup,
): string {
	const resolvedFields = resolveFields(fields);

	// If no fields specified, return null to indicate default formatting should be used
	if (!resolvedFields) {
		return "";
	}

	const output: string[] = [];

	// Handle multi-faced cards specially
	if (card.card_faces && card.card_faces.length > 0) {
		output.push(`**${card.name}**`);
		output.push("");

		for (const face of card.card_faces) {
			output.push(`Face: ${face.name}`);
			output.push(formatCardFace(face, resolvedFields));
			output.push("");
		}

		// Also include card-level fields that aren't on faces
		const cardLevelFields = resolvedFields.filter(
			(field) =>
				![
					"name",
					"mana_cost",
					"type_line",
					"oracle_text",
					"power",
					"toughness",
					"loyalty",
					"colors",
				].includes(field as string),
		);

		if (cardLevelFields.length > 0) {
			output.push("Card Properties:");
			for (const field of cardLevelFields) {
				const value = getFieldValue(card, field);
				if (value !== undefined && value !== null) {
					output.push(`  ${field}: ${formatFieldValue(field, value)}`);
				}
			}
		}
	} else {
		// Single-faced card - simple formatting
		output.push(`**${card.name}**`);
		output.push("");

		for (const field of resolvedFields) {
			// Skip the name field since we already showed it
			if (field === "name") continue;

			const value = getFieldValue(card, field);
			if (value !== undefined && value !== null) {
				output.push(`${field}: ${formatFieldValue(field, value)}`);
			}
		}
	}

	return output.join("\n");
}

/**
 * Format multiple cards with optional field selection
 * @param cards - Array of Scryfall card objects
 * @param fields - Optional array of fields to include, or a predefined group name
 * @param limit - Maximum number of cards to format
 * @returns Formatted string representation of the cards
 */
export function formatCards(
	cards: ScryfallCard[],
	fields?: CardField[] | CardFieldGroup,
	limit = 10,
): string {
	const resolvedFields = resolveFields(fields);

	if (!resolvedFields) {
		return "";
	}

	const cardsToShow = cards.slice(0, limit);
	const output: string[] = [];

	output.push(`Showing ${cardsToShow.length} of ${cards.length} cards:\n`);

	for (const card of cardsToShow) {
		output.push(formatCard(card, fields));
		output.push("\n---\n");
	}

	if (cards.length > limit) {
		output.push(`... and ${cards.length - limit} more cards`);
	}

	return output.join("\n");
}
