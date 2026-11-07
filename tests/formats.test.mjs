/**
 * Supported-conversions surface — ported from scripts/verify-formats.mjs.
 */
import { describe, it, expect } from "vitest";
import { converter } from "./helpers/converter.mjs";

describe("getSupportedConversions", () => {
  it("offers bmp for .png", () => {
    expect(converter.getSupportedConversions(".png")).toContain("bmp");
  });

  it("no longer offers rar for .zip", () => {
    expect(converter.getSupportedConversions(".zip")).not.toContain("rar");
  });

  it("offers zip <-> tar in both directions", () => {
    expect(converter.getSupportedConversions(".zip")).toContain("tar");
    expect(converter.getSupportedConversions(".tar")).toContain("zip");
  });
});
