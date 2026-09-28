import { AugmentGroup, BaseType } from "@/assets/data";
import { ItemCategory } from "@/parser/meta";
import { ParsedItem } from "@/parser/ParsedItem";
import { buildEditorItems } from "./augment-builder";
import {
  INTERNAL_AUGMENT_TYPES,
  ModifierType,
  sumStatsByModType,
} from "./modifiers";
import { EditorItem } from "./ParsedItem";
import { parseStatsFromMod } from "./Parser";
import { recalculateItemProperties } from "./calc-base";

/* ------------------------------------------------------------------
   Rune / augment application.

   This used to live under `web/price-check/item-editor/`, but it is pure
   parsing logic — it mutates a ParsedItem and recalculates its properties,
   with no dependency on any UI. Living in the parser layer keeps the
   dependency direction one-way (parser -> settings) and removes the
   circular import between Parser.ts and augment-builder.ts.
   ------------------------------------------------------------------ */

/** Every augment option for a category, grouped the way the editor shows it. */
export function getCategoryGroups(
  augments: AugmentGroup<BaseType>,
  category: ItemCategory,
): AugmentGroup<EditorItem> {
  return {
    Rune: {
      Lesser: buildEditorItems(augments.Rune.Lesser, category),
      Normal: buildEditorItems(augments.Rune.Normal, category),
      Greater: buildEditorItems(augments.Rune.Greater, category),
      Perfect: buildEditorItems(augments.Rune.Perfect, category),
      Other: buildEditorItems(augments.Rune.Other, category),
    },
    SoulCore: {
      Normal: buildEditorItems(augments.SoulCore.Normal, category),
      Special: buildEditorItems(augments.SoulCore.Special, category),
    },
    Idol: buildEditorItems(augments.Idol, category),
    Legacy: buildEditorItems(augments.Legacy, category),
    Other: buildEditorItems(augments.Other, category),
  };
}

/**
 * Socket `augment` into `item` at `index`, then rebuild the item's stats and
 * base/total properties so the price check reflects the new rune.
 */
export function useAugment(item: ParsedItem, augment: EditorItem, index: number) {
  if (!item.augmentSockets || item.augmentSockets.augments.length < index) {
    throw new Error("Augment index out of bounds");
  }

  // snapshot for the before/after property recalculation
  const oldItem = JSON.parse(JSON.stringify(item)) as ParsedItem;

  // drop the previously-applied augment stats
  item.newMods = item.newMods.filter(
    (mod) => !INTERNAL_AUGMENT_TYPES.has(mod.info.type),
  );
  item.statsByType = item.statsByType.filter(
    (stat) => !INTERNAL_AUGMENT_TYPES.has(stat.type),
  );

  item.augmentSockets.augments[index] = augment;

  // re-add every socketed augment so stats don't double up
  for (const thisAugment of item.augmentSockets.augments) {
    if (!thisAugment) continue;
    const modInfo = {
      // pre-existing runes are reported as a plain augment, added ones are not
      type: thisAugment.existing
        ? ModifierType.Augment
        : ModifierType.AddedAugment,
      tags: [],
    };
    parseStatsFromMod(
      thisAugment.displayString.split("\n"),
      item,
      { info: modInfo, stats: [] },
      thisAugment.existing ? undefined : thisAugment.baseItem,
    );
  }

  item.statsByType = sumStatsByModType(item.newMods);
  recalculateItemProperties(item, oldItem);
}
