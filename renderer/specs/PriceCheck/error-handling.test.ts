/**
 * The engine must never surface a raw TypeError to the UI. Malformed
 * clipboard text should come back as a typed parse error instead.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { setupTests } from "@specs/vitest.setup";

describe("parseClipboard error handling", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  const badInputs: Array<[string, string]> = [
    ["plain chat text", "just some chat text, definitely not an item"],
    ["empty string", ""],
    ["only a header", "Item Class: Bows"],
    ["just a rarity", "Rarity: Rare"],
    ["blank lines", "\n\n\n"],
  ];

  it.each(badInputs)("returns Err (never throws) for %s", (_label, input) => {
    let result: ReturnType<typeof parseClipboard> | undefined;
    // a throw here would be the bug: the UI expects a Result, not an exception
    expect(() => {
      result = parseClipboard(input);
    }).not.toThrow();

    expect(result!.isErr()).toBe(true);
    expect(typeof result!.error).toBe("string");
  });
});
