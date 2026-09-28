/**
 * Smoke test for the price-check entry point.
 *
 * The unit suite covers parser internals; this covers the exact call the
 * engine makes — `parseClipboard(clipboardText)` — using real in-game
 * fixtures, so a regression in the wiring shows up here first.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { ItemRarity } from "@/parser/ParsedItem";
import { setupTests } from "@specs/vitest.setup";
import { RareItem, NormalItem } from "../Parser/items";

/* PoE2 copies mods with `{ Prefix Modifier ... }` annotation lines. A string
   without them parses as an item but yields no stats, which is why the
   fixtures are used here rather than hand-written text. */
const CHAOS_ORB = `Item Class: Stackable Currency
Rarity: Currency
Chaos Orb
--------
Stack Size: 12/20
--------
Reforges a rare item with new random modifiers`;

describe("price-check engine entry point", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("parses a rare weapon, mods included", () => {
    const result = parseClipboard(RareItem.rawText);

    expect(result.isOk()).toBe(true);
    const item = result._unsafeUnwrap();

    expect(item.rarity).toBe(ItemRarity.Rare);
    expect(item.itemLevel).toBe(80);
    expect(item.rawText).toBe(RareItem.rawText);
    // the UI reads its heading from the item database entry
    expect(item.info?.name).toBe("Rider Bow");
    // and a trade search needs the mods
    expect(item.newMods.length).toBeGreaterThan(0);
    expect(item.statsByType.length).toBeGreaterThan(0);
  });

  it("parses a stackable currency item", () => {
    const result = parseClipboard(CHAOS_ORB);

    expect(result.isOk()).toBe(true);
    const item = result._unsafeUnwrap();

    expect(item.stackSize?.value).toBe(12);
    expect(item.stackSize?.max).toBe(20);
    expect(item.info?.name).toBe("Chaos Orb");
  });

  it("parses a normal item", () => {
    const result = parseClipboard(NormalItem.rawText);
    expect(result.isOk()).toBe(true);
  });

  it("rejects text that is not an item", () => {
    const result = parseClipboard("just some chat text, definitely not an item");
    expect(result.isErr()).toBe(true);
  });
});
