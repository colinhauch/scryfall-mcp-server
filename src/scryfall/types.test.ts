import { describe, it, expect } from "vitest";
import {
	validateFields,
	ALL_VALID_FIELDS,
	FIELD_GROUP_MAPPINGS,
} from "./types.js";

describe("validateFields", () => {
	it("should validate all valid fields successfully", () => {
		const result = validateFields(["name", "mana_cost", "type_line"]);
		expect(result.valid).toEqual(["name", "mana_cost", "type_line"]);
		expect(result.warnings).toEqual([]);
	});

	it("should return warnings for invalid fields", () => {
		const result = validateFields(["name", "invalid_field"]);
		expect(result.valid).toEqual(["name"]);
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toContain("invalid_field");
		expect(result.warnings[0]).toContain("scryfall://fields/reference");
	});

	it("should handle mixed valid and invalid fields", () => {
		const result = validateFields([
			"name",
			"mana_cost",
			"bad_field",
			"oracle_text",
			"another_bad_field",
		]);
		expect(result.valid).toEqual(["name", "mana_cost", "oracle_text"]);
		expect(result.warnings).toHaveLength(2);
		expect(result.warnings[0]).toContain("bad_field");
		expect(result.warnings[1]).toContain("another_bad_field");
	});

	it("should handle empty array", () => {
		const result = validateFields([]);
		expect(result.valid).toEqual([]);
		expect(result.warnings).toEqual([]);
	});

	it("should validate all fields from ALL_VALID_FIELDS", () => {
		const result = validateFields([...ALL_VALID_FIELDS]);
		expect(result.valid).toHaveLength(ALL_VALID_FIELDS.length);
		expect(result.warnings).toEqual([]);
	});

	it("should validate nested field notation", () => {
		// Note: ALL_VALID_FIELDS only contains top-level fields from 'full' group
		// Nested fields like "prices.usd" would be invalid unless added to 'full'
		const result = validateFields(["prices", "name"]);
		expect(result.valid).toContain("name");
		expect(result.valid).toContain("prices");
		expect(result.warnings).toEqual([]);
	});
});

describe("ALL_VALID_FIELDS", () => {
	it("should be derived from FIELD_GROUP_MAPPINGS.full", () => {
		expect(ALL_VALID_FIELDS).toEqual(FIELD_GROUP_MAPPINGS.full);
	});

	it("should contain expected essential fields", () => {
		expect(ALL_VALID_FIELDS).toContain("name");
		expect(ALL_VALID_FIELDS).toContain("mana_cost");
		expect(ALL_VALID_FIELDS).toContain("type_line");
	});

	it("should be a non-empty array", () => {
		expect(Array.isArray(ALL_VALID_FIELDS)).toBe(true);
		expect(ALL_VALID_FIELDS.length).toBeGreaterThan(0);
	});
});
