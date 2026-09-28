<template>
  <div v-if="display" :class="$style.card">
    <!-- header -->
    <div :class="$style.head">
      <div :class="$style.iconBox">
        <img
          v-if="display.icon"
          :class="$style.iconImg"
          :src="display.icon.url"
          alt=""
        />
      </div>
      <div :class="$style.meta">
        <div :class="[$style.name, rarityClass]">{{ title }}</div>
        <div v-if="baseType" :class="$style.sub">{{ baseType }}</div>
        <div :class="$style.chips">
          <Badge
            variant="outline"
            :class="[rarityClass, 'border-white/15 bg-white/10']"
          >
            {{ rarity }}
          </Badge>
          <Badge
            v-if="isCorrupted"
            variant="outline"
            class="border-transparent bg-pink-500/15 text-pink-300"
          >
            Corrupted
          </Badge>
        </div>
      </div>
    </div>

    <!-- properties -->
    <div v-if="properties.length" :class="$style.section">
      <div :class="$style.sectionLabel">Properties</div>
      <div :class="$style.propGrid">
        <template v-for="(p, i) in properties" :key="i">
          <span :class="$style.propKey">{{ p.label }}</span>
          <span :class="$style.propVal">{{ p.value }}</span>
        </template>
      </div>
    </div>

    <!-- modifiers, grouped by type -->
    <div
      v-for="section in modSections"
      :key="section.label"
      :class="$style.section"
    >
      <div :class="$style.sectionLabel">{{ section.label }}</div>
      <div :class="$style.modList">
        <div v-for="(mod, i) in section.mods" :key="i" :class="$style.modRow">
          <span :class="$style.modText">{{ mod.text }}</span>
          <span
            v-if="mod.value"
            :class="[$style.modVal, colorClass(mod.color)]"
            >{{ mod.value }}</span
          >
          <span v-if="mod.tier" :class="$style.tier">{{ mod.tier }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useI18n } from "vue-i18n";
import { Badge } from "@/components/ui/badge";
import type { DisplayItemLine, PricingResult } from "./pathofexile-trade";

const STRIP_PERCENT = new Set([
  "item.crit",
  "item.map_pack_size",
  "item.map_magic_monsters",
  "item.map_rare_monsters",
  "item.map_drop_chance",
  "item.map_item_rarity",
  "item.map_gold",
]);

const MOD_SECTIONS: Array<
  [keyof NonNullable<PricingResult["displayItem"]>, string]
> = [
  ["enchantMods", "Enchant"],
  ["runeMods", "Runes"],
  ["grantSkill", "Grants Skill"],
  ["implicitMods", "Implicit"],
  ["fracturedMods", "Fractured"],
  ["explicitMods", "Explicit"],
  ["desecratedMods", "Desecrated"],
  ["mutatedMods", "Mutated"],
  ["veiledMods", "Veiled"],
  ["pseudoMods", "Pseudo"],
];

export default defineComponent({
  name: "SellerItemPreview",
  components: { Badge },
  props: {
    result: {
      type: Object as PropType<PricingResult>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const display = computed(() => props.result.displayItem);

    const rarity = computed(() => display.value?.rarity ?? "Normal");
    const rarityClass = computed(() => {
      switch (rarity.value) {
        case "Unique":
          return "text-unique";
        case "Rare":
          return "text-rare";
        case "Magic":
          return "text-magic";
        default:
          return "text-normal";
      }
    });

    const title = computed(() => display.value?.title?.join(" ") ?? "");
    const baseType = computed(() => display.value?.nameBlock?.[0]?.text ?? "");
    const isCorrupted = computed(() =>
      (display.value?.explicitMods ?? []).some((m) =>
        m.text.toLowerCase().includes("corrupted"),
      ),
    );

    function translate(text: string): string {
      const translated = t(text);
      if (STRIP_PERCENT.has(text)) {
        return translated.slice(0, translated.lastIndexOf(" ")) + " ";
      }
      return translated;
    }

    const properties = computed<Array<{ label: string; value: string }>>(() => {
      const d = display.value;
      if (!d) return [];
      return (d.itemProps ?? []).map((m) => {
        const text = translate(m.text);
        const value = m.value != null ? String(m.value) : "";
        if (text.trimEnd().endsWith(":")) {
          return { label: text.trimEnd().slice(0, -1), value };
        }
        return { label: text, value };
      });
    });

    const modSections = computed<
      Array<{ label: string; mods: DisplayItemLine[] }>
    >(() => {
      const d = display.value;
      if (!d) return [];
      const out: Array<{ label: string; mods: DisplayItemLine[] }> = [];
      for (const [key, label] of MOD_SECTIONS) {
        const lines = (d[key] as DisplayItemLine[] | undefined) ?? [];
        if (!lines.length) continue;
        out.push({
          label,
          mods: lines.map((m) => ({ ...m, text: translate(m.text) })),
        });
      }
      return out;
    });

    function colorClass(color?: number): string {
      switch (color) {
        case 4:
          return "text-fire";
        case 5:
          return "text-cold";
        case 6:
          return "text-lightning";
        case 7:
          return "text-pink-400";
        case 8:
          return "text-unique";
        case 2:
          return "text-red-500";
        default:
          return "text-gray-200";
      }
    }

    return {
      display,
      rarity,
      rarityClass,
      title,
      baseType,
      isCorrupted,
      properties,
      modSections,
      colorClass,
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../../assets/tailwind.css";

.card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem;
}

/* header */
.head {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.iconBox {
  width: 3.6rem;
  height: 3.6rem;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 0.9rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid theme("colors.gray.700");
  overflow: hidden;
  padding: 0.25rem;
}

.iconImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.meta {
  min-width: 0;
}

.name {
  font-weight: 800;
  font-size: 1rem;
  line-height: 1.15;
}

.sub {
  font-size: 0.74rem;
  @apply text-gray-400;
  margin-top: 0.1rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.4rem;
}

.chip {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.bad {
  color: #ff8f9f;
  background: rgba(255, 95, 160, 0.14);
}

/* sections */
.section {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.sectionLabel {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  @apply text-gray-500;
}

/* properties as key/value rows */
.propGrid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.2rem 0.75rem;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.7rem;
  padding: 0.5rem 0.6rem;
}

.propKey {
  font-size: 0.72rem;
  @apply text-gray-400;
  white-space: nowrap;
}

.propVal {
  font-size: 0.74rem;
  font-weight: 700;
  @apply text-gray-100;
  text-align: right;
}

/* mods */
.modList {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.modRow {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 0.76rem;
  @apply text-gray-300;
  line-height: 1.3;
  padding: 0.3rem 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
}

.modText {
  flex: 1;
}

.modVal {
  font-weight: 800;
}

.tier {
  flex: none;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  @apply text-gray-300;
}
</style>
