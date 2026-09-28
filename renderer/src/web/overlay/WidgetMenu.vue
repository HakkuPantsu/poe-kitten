<template>
  <widget
    :config="config"
    :hideable="false"
    :removable="false"
    move-handles="corners"
    v-slot="{ isEditing }"
  >
    <div :class="$style.dash" class="widget-default-style">
      <!-- header -->
      <header :class="$style.head">
        <img :class="$style.logo" src="/images/kitten.svg" alt="" />
        <div :class="$style.brand">
          <b>{{ view === "settings" ? "Settings" : "POE Kitten" }}</b>
          <span>{{
            view === "settings"
              ? "Hotkeys, appearance and tools"
              : "All-in-one Path of Exile 2 toolkit"
          }}</span>
        </div>
        <Select
          v-if="view === 'home'"
          :model-value="selectedLeagueId"
          @update:model-value="(v) => selectLeague(String(v))"
        >
          <SelectTrigger
            class="h-8 w-56 shrink-0 rounded-full bg-black/20"
            title="Change league"
          >
            <span :class="$style.dot" />
            <SelectValue :placeholder="leagueName" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="l in leagueList" :key="l.id" :value="l.id">
              {{ l.text }}
            </SelectItem>
            <div v-if="!leagueList.length" :class="$style.leagueEmpty">
              Loading leagues…
            </div>
          </SelectContent>
        </Select>
        <Tooltip v-if="view === 'settings'">
          <TooltipTrigger as-child>
            <button :class="$style.headBtn" @click="view = 'home'">
              <i class="fas fa-arrow-left" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>
        <Tooltip v-else>
          <TooltipTrigger as-child>
            <button :class="$style.headBtn" @click="view = 'settings'">
              <i class="fas fa-gear" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </header>

      <template v-if="view === 'home'">
        <!-- search -->
        <div :class="$style.searchRow">
          <i class="fas fa-search" :class="$style.searchIcon" />
          <Input
            :value="query"
            class="h-auto flex-1 border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none focus-visible:ring-0"
            placeholder="Search tools and actions…"
            spellcheck="false"
            @input="query = ($event.target as HTMLInputElement).value"
            @keydown.enter="runSelected"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
          />
          <button v-if="query" :class="$style.clear" @click="query = ''">
            <i class="fas fa-times" />
          </button>
        </div>

        <!-- first-run onboarding -->
        <div v-if="!seenWelcome" :class="$style.welcome">
          <img :class="$style.welcomeLogo" src="/images/kitten.svg" alt="" />
          <h2 :class="$style.welcomeTitle">
            Price check your first item in 10 seconds.
          </h2>
          <p :class="$style.welcomeLead">
            No setup needed — we found your game.
          </p>
          <div :class="$style.detected">
            <i class="fas fa-check-circle" /> Detected: {{ detectedGame }}
          </div>
          <div :class="$style.trio">
            <div :class="$style.trioCard">
              <span :class="$style.trioIc">🖱️</span>
              <b>1. Hover an item</b>
              <span>In your inventory, stash or on the ground.</span>
            </div>
            <div :class="$style.trioCard">
              <span :class="$style.trioIc">⌨️</span>
              <b>2. Press the key</b>
              <span :class="$style.trioKbd">{{
                priceCheckHotkey || "Ctrl + F6"
              }}</span>
            </div>
            <div :class="$style.trioCard">
              <span :class="$style.trioIc">💰</span>
              <b>3. See the price</b>
              <span>Instantly, with the cheapest listing ready.</span>
            </div>
          </div>
          <button :class="$style.welcomeBtn" @click="dismissWelcome">
            ✨ Got it — let's go
          </button>
        </div>

        <!-- tools -->
        <div v-else :class="$style.grid">
          <button
            v-for="(row, i) in rows"
            :key="row.key"
            :class="[
              $style.card,
              { [$style.cardSel]: i === selected, [$style.cardOn]: row.active },
            ]"
            @click="runRow(row)"
            @mouseenter="selected = i"
          >
            <span :class="$style.cardIcon">
              <i class="fas" :class="row.icon" />
            </span>
            <span :class="$style.cardBody">
              <b>{{ row.name }}</b>
              <span>{{ row.desc }}</span>
            </span>
            <span :class="$style.cardMeta">
              <span v-if="row.hotkey" :class="$style.kbd">{{
                row.hotkey
              }}</span>
              <span
                v-else-if="row.status"
                :class="[$style.status, { [$style.statusOn]: row.active }]"
                >{{ row.status }}</span
              >
            </span>
          </button>
          <div v-if="!rows.length" :class="$style.empty">
            <i class="fas fa-ghost" /> Nothing matches “{{ query }}”
          </div>
        </div>

        <!-- recent checks -->
        <div v-if="recentChecks.length" :class="$style.historySection">
          <div :class="$style.whisperHead">
            <span>Recent checks</span>
            <button :class="$style.whisperClear" @click="clearRecentChecks">
              Clear
            </button>
          </div>
          <div :class="$style.checkList">
            <button
              v-for="r in recentChecks"
              :key="r.id"
              :class="$style.checkRow"
              title="Price check again"
              @click="recheck(r.item)"
            >
              <img
                :class="$style.checkIcon"
                :src="
                  r.item.info.icon && r.item.info.icon !== '%NOT_FOUND%'
                    ? r.item.info.icon
                    : '/images/404.png'
                "
                alt=""
              />
              <span :class="[$style.checkName, rarityClass(r.item.rarity)]">{{
                r.item.info.name
              }}</span>
            </button>
          </div>
        </div>

        <!-- recent deaths -->
        <div v-if="deathLog.length" :class="$style.historySection">
          <div :class="$style.whisperHead">
            <span>Death zones</span>
            <span :class="$style.whisperClear">{{ sessionDeaths }} total</span>
          </div>
          <div :class="$style.deathList">
            <div
              v-for="[area, count] in deathsByArea.slice(0, 6)"
              :key="area"
              :class="$style.deathRow"
            >
              <i class="fas fa-skull" :class="$style.deathIcon" />
              <span :class="$style.deathZone">{{ area }}</span>
              <span :class="$style.deathTime">×{{ count }}</span>
            </div>
          </div>
        </div>

        <!-- recent whispers -->
        <div v-if="whispers.length" :class="$style.whisperSection">
          <div :class="$style.whisperHead">
            <span>Recent whispers</span>
            <button :class="$style.whisperClear" @click="clearWhispers">
              Clear
            </button>
          </div>
          <div :class="$style.whisperList">
            <div
              v-for="w in whispers"
              :key="w.id"
              :class="[
                $style.whisperRow,
                {
                  [$style.whisperDone]:
                    w.status === 'sold' || w.status === 'gone',
                },
              ]"
            >
              <div :class="$style.whisperTxt">
                <b>{{ w.from }}</b>
                <span>{{
                  w.trade ? `${w.trade.item} · ${w.trade.price}` : w.message
                }}</span>
              </div>
              <span
                v-if="w.status !== 'new'"
                :class="[$style.statusTag, $style['st_' + w.status]]"
                >{{ w.status }}</span
              >
              <button
                v-if="w.status === 'new'"
                :class="$style.whisperBtn"
                @click="inviteBuyer(w)"
              >
                Invite
              </button>
              <template v-else-if="w.status === 'invited'">
                <button :class="$style.whisperBtn" @click="markSold(w)">
                  Sold
                </button>
                <button :class="$style.whisperBtn2" @click="markGone(w)">
                  Gone
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- footer -->
        <footer :class="$style.foot">
          <div v-if="isEditing" :class="$style.editRow">
            <ui-toggle v-model="config.alwaysShow">{{
              t(":always_show")
            }}</ui-toggle>
          </div>
          <div v-else :class="$style.pasteWrap">
            <textarea
              :class="$style.pasteBox"
              rows="1"
              spellcheck="false"
              :placeholder="placeholder"
              @input="handleItemPaste"
            ></textarea>
          </div>
          <div :class="$style.footRight">
            <ui-popover>
              <template #target>
                <button :class="$style.addBtn">
                  <i class="fas fa-plus" /> Add a tool
                </button>
              </template>
              <template #content>
                <div class="flex flex-col text-base">
                  <button
                    v-for="spec in instantiableWidgets"
                    :key="spec.type"
                    :class="$style.addItem"
                    @click="createOfType(spec.type)"
                  >
                    {{ t(spec.trNameKey ?? spec.type) }}
                  </button>
                </div>
              </template>
            </ui-popover>
            <span :class="$style.hint"
              >↑↓ move · ↵ run · Shift+Space close</span
            >
          </div>
        </footer>
      </template>

      <div v-else class="grow min-h-0 flex" style="min-height: 24rem">
        <SettingsPanel class="grow" @close="view = 'home'" />
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  inject,
  ref,
  nextTick,
} from "vue";
import UiToggle from "@/web/ui/UiToggle.vue";
import UiPopover from "@/web/ui/Popover.vue";
import { AppConfig, saveConfig } from "@/web/Config";
import { useLeagues } from "@/web/background/Leagues";
import {
  Widget as IWidget,
  WidgetManager,
  WidgetMenu,
  WidgetSpec,
} from "./interfaces";
import { registry } from "./widget-registry";
import { Host } from "@/web/background/IPC";
import Widget from "./Widget.vue";
import SettingsPanel from "@/web/settings/SettingsPanel.vue";
import { useWhispers } from "@/web/session/whispers";
import { useRecentChecks } from "@/web/price-check/recent-checks";
import { useSession } from "@/web/session/session";
import { ItemRarity, type ParsedItem } from "@/parser";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useI18nNs } from "@/web/i18n";

interface WidgetMeta {
  icon: string;
  name: string;
  desc: string;
}

const META: Record<string, WidgetMeta> = {
  "price-check": {
    icon: "fa-tag",
    name: "Price check",
    desc: "Hover an item in-game to check what it's worth.",
  },
  "item-check": {
    icon: "fa-map",
    name: "Item check",
    desc: "See a map / waystone's value and danger.",
  },
  "stash-search": {
    icon: "fa-box-open",
    name: "Stash search",
    desc: "Highlight matching items in your stash.",
  },
  "image-strip": {
    icon: "fa-images",
    name: "Cheat sheets",
    desc: "Pin reference images on your screen.",
  },
  "notepad": {
    icon: "fa-sticky-note",
    name: "Notepad",
    desc: "A quick in-game notepad.",
  },
  "session": {
    icon: "fa-gauge-high",
    name: "Session HUD",
    desc: "Playtime, area timer, deaths and zones run.",
  },
  "settings": {
    icon: "fa-cog",
    name: "Settings",
    desc: "Hotkeys, appearance and more.",
  },
};

interface Row {
  key: string;
  icon: string;
  name: string;
  desc: string;
  hotkey: string | null;
  status: string | null;
  active: boolean;
  run: () => void;
}

export default defineComponent({
  widget: {
    type: "menu",
    instances: "single",
    initInstance: (): WidgetMenu => {
      return {
        wmId: 0,
        wmType: "menu",
        wmTitle: "",
        wmWants: "show",
        wmZorder: 1,
        wmFlags: ["invisible-on-blur", "menu::skip"],
        anchor: {
          pos: "tc",
          x: 50,
          y: 6,
        },
        alwaysShow: false,
      };
    },
  } satisfies WidgetSpec,
  components: {
    Widget,
    UiToggle,
    UiPopover,
    SettingsPanel,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Input,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
  },
  props: {
    config: {
      type: Object as PropType<WidgetMenu>,
      required: true,
    },
  },
  setup() {
    const wm = inject<WidgetManager>("wm")!;
    const { t } = useI18nNs("widget_menu");

    const searchEl = ref<HTMLInputElement | null>(null);
    const query = ref("");
    const selected = ref(0);
    const view = ref<"home" | "settings">("home");

    const leagues = useLeagues();
    const leagueList = computed(() => leagues.list.value);
    const selectedLeagueId = computed(() => leagues.selectedId.value);
    const leagueName = computed(() => {
      const id = leagues.selectedId.value;
      if (!id) {
        return leagues.isLoading.value ? "Loading leagues…" : "Select league";
      }
      const found = leagues.list.value.find((l) => l.id === id);
      return found?.text ?? id;
    });

    function selectLeague(id: string) {
      leagues.selectedId.value = id;
      saveConfig();
    }

    const seenWelcome = ref(AppConfig().seenWelcome);
    const {
      entries: whispers,
      clear: clearWhispers,
      setStatus: setWhisperStatus,
    } = useWhispers();
    const { entries: recentChecks, clear: clearRecentChecks } =
      useRecentChecks();
    const { deathLog, deaths: sessionDeaths, deathsByArea } = useSession();

    function inviteBuyer(w: { id: number; from: string }) {
      navigator.clipboard.writeText(`/invite ${w.from}`);
      setWhisperStatus(w.id, "invited");
    }

    function markSold(w: { id: number }) {
      setWhisperStatus(w.id, "sold");
    }

    function markGone(w: { id: number }) {
      setWhisperStatus(w.id, "gone");
    }

    function timeAgo(ts: number) {
      const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
      if (s < 60) return `${s}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}m ago`;
    }

    function invite(name: string) {
      navigator.clipboard.writeText(`/invite ${name}`);
    }

    function recheck(item: ParsedItem) {
      Host.selfDispatch({
        name: "MAIN->CLIENT::item-text",
        payload: {
          clipboard: item.rawText,
          item,
          position: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          },
          focusOverlay: true,
          target: "price-check",
        },
      });
    }

    function rarityClass(rarity?: ItemRarity) {
      switch (rarity) {
        case ItemRarity.Unique:
          return "text-unique";
        case ItemRarity.Rare:
          return "text-rare";
        case ItemRarity.Magic:
          return "text-magic";
        default:
          return "text-normal";
      }
    }
    const detectedGame = computed(
      () => AppConfig().windowTitle || "Path of Exile 2",
    );

    function dismissWelcome() {
      AppConfig().seenWelcome = true;
      seenWelcome.value = true;
      saveConfig();
    }

    const priceCheckHotkey = computed(() => {
      const priceCheck = wm.widgets.value.find(
        (w) => w.wmType === "price-check",
      ) as (IWidget & { hotkeyHold?: string; hotkey?: string }) | undefined;
      return priceCheck?.hotkeyHold && priceCheck?.hotkey
        ? `${priceCheck.hotkeyHold} + ${priceCheck.hotkey}`
        : null;
    });

    const placeholder = computed(() =>
      priceCheckHotkey.value
        ? `Price check by hovering, or paste item text · ${priceCheckHotkey.value}`
        : "Price check by hovering, or paste item text",
    );

    const rows = computed<Row[]>(() => {
      const q = query.value.trim().toLowerCase();
      const list: Row[] = wm.widgets.value
        .filter((w) => w.wmType !== "menu")
        .map((w) => {
          const meta = META[w.wmType] ?? {
            icon: "fa-cube",
            name: w.wmType,
            desc: "",
          };
          const isSettings = w.wmType === "settings";
          const isPriceCheck = w.wmType === "price-check";
          const rawTitle = (w.wmTitle ?? "")
            .replace(/^\{icon=[^}]+\}\s*/, "")
            .trim();
          return {
            key: `w${w.wmId}`,
            icon: meta.icon,
            name: rawTitle ? `${meta.name} — ${rawTitle}` : meta.name,
            desc: meta.desc,
            hotkey: isPriceCheck ? priceCheckHotkey.value : null,
            status:
              isSettings || isPriceCheck
                ? null
                : w.wmWants === "show"
                  ? "On"
                  : "Off",
            active: w.wmWants === "show",
            run: () => {
              if (isSettings) {
                view.value = "settings";
              } else {
                toggle(w);
              }
            },
          };
        })
        .filter((r) => !q || `${r.name} ${r.desc}`.toLowerCase().includes(q));

      list.sort((a, b) => {
        const rank = (r: Row) => (r.name.startsWith("Price check") ? 0 : 1);
        return rank(a) - rank(b);
      });
      return list;
    });

    function runRow(row: Row) {
      row.run();
    }

    function runSelected() {
      const row = rows.value[selected.value];
      if (row) row.run();
    }

    function move(dir: number) {
      const n = rows.value.length;
      if (!n) return;
      selected.value = (selected.value + dir + n) % n;
    }

    function toggle(widget: Pick<IWidget, "wmId" | "wmWants">) {
      if (widget.wmWants === "hide") {
        wm.show(widget.wmId);
      } else {
        wm.hide(widget.wmId);
      }
    }

    function createOfType(type: string) {
      wm.create(type);
      nextTick(() => {
        const created = wm.widgets.value.findLast((w) => w.wmType === type);
        if (created) wm.show(created.wmId);
      });
    }

    function handleItemPaste(e: Event) {
      const target = e.target as HTMLInputElement;
      const inputRect = target.getBoundingClientRect();
      Host.selfDispatch({
        name: "MAIN->CLIENT::item-text",
        payload: {
          clipboard: target.value,
          position: {
            x: window.screenX + inputRect.x + inputRect.width / 2,
            y: window.screenY + inputRect.y + inputRect.height / 2,
          },
          focusOverlay: true,
          target: "price-check",
        },
      });
      target.value = "";
    }

    return {
      t,
      query,
      selected,
      rows,
      leagueList,
      selectedLeagueId,
      leagueName,
      selectLeague,
      seenWelcome,
      detectedGame,
      dismissWelcome,
      whispers,
      clearWhispers,
      invite,
      inviteBuyer,
      markSold,
      markGone,
      recentChecks,
      clearRecentChecks,
      recheck,
      rarityClass,
      deathLog,
      sessionDeaths,
      deathsByArea,
      timeAgo,
      priceCheckHotkey,
      placeholder,
      searchEl,
      runRow,
      runSelected,
      move,
      createOfType,
      view,
      handleItemPaste,
      instantiableWidgets: computed(() =>
        registry.widgets
          .filter(({ widget }) => widget.instances === "multi")
          .map(({ widget }) => widget),
      ),
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.dash {
  width: 46rem;
  max-width: 94vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* header */
.head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 0.95rem;
  background: linear-gradient(
    120deg,
    rgba(168, 85, 247, 0.2),
    rgba(255, 95, 176, 0.12)
  );
  border-bottom: 2px dashed theme("colors.gray.700");
}

.logo {
  width: 2.6rem;
  height: 2.6rem;
  flex: none;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
}

.brand {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  b {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    background: linear-gradient(90deg, #e0a8ff, #ff8fd0, #8fd4ff, #e0a8ff);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: brandShift 8s linear infinite;
  }

  span {
    @apply text-gray-500;
    font-size: 0.72rem;
  }
}

.league {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  @apply text-gray-200;
  background: rgba(0, 0, 0, 0.28);
  border: 2px solid theme("colors.gray.700");
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.12s ease;

  &:hover {
    border-color: rgba(199, 125, 255, 0.5);
  }
}

.leagueCaret {
  font-size: 0.6rem;
  @apply text-gray-400;
}

.leagueMenu {
  display: flex;
  flex-direction: column;
  min-width: 12rem;
  max-height: 16rem;
  overflow-y: auto;
  padding: 0.3rem;
}

.leagueMenuHead {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  @apply text-gray-500;
  padding: 0.35rem 0.5rem 0.2rem;
}

.leagueItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  border-radius: 0.55rem;
  padding: 0.4rem 0.55rem;
  font-size: 0.78rem;
  @apply text-gray-200;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.leagueItemOn {
  color: #fff;
  background: linear-gradient(
    90deg,
    rgba(199, 125, 255, 0.22),
    rgba(255, 95, 176, 0.1)
  );
}

.leagueCheck {
  margin-left: auto;
  color: #ff8fd0;
}

.leagueEmpty {
  @apply text-gray-500;
  padding: 0.6rem;
  font-size: 0.78rem;
}

.dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #59d97a;
  box-shadow: 0 0 8px #59d97a;
}

@keyframes brandShift {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 300% 50%;
  }
}

.headBtn {
  flex: none;
  width: 2.2rem;
  height: 2.2rem;
  display: grid;
  place-items: center;
  border-radius: 0.7rem;
  @apply text-gray-300;
  border: 2px solid transparent;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
}

/* search */
.searchRow {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0.7rem 0.9rem 0.3rem;
  padding: 0 0.9rem;
  height: 2.7rem;
  border-radius: 0.9rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid theme("colors.gray.700");
}

.searchIcon {
  @apply text-gray-400;
}

.searchInput {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: theme("colors.gray.100");
  font: inherit;
  font-size: 0.95rem;
  font-weight: 500;

  &::placeholder {
    @apply text-gray-500;
  }
}

.clear {
  @apply text-gray-500 rounded-md px-1;

  &:hover {
    @apply text-gray-200;
  }
}

/* tool grid */
.grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-align: left;
  padding: 0.75rem 0.8rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid theme("colors.gray.700");
  animation: cardIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition:
    transform 0.1s ease,
    border-color 0.12s ease,
    background-color 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.98);
  }
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.cardSel {
  border-color: rgba(199, 125, 255, 0.6);
  background: linear-gradient(
    90deg,
    rgba(199, 125, 255, 0.16),
    rgba(255, 95, 176, 0.07)
  );
}

.cardIcon {
  flex: none;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  display: grid;
  place-items: center;
  font-size: 1.05rem;
  @apply text-gray-100 bg-gray-800;
  border: 2px solid theme("colors.gray.700");
}

.cardOn .cardIcon,
.cardSel .cardIcon {
  color: #fff;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
  border-color: transparent;
}

.cardBody {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  b {
    font-size: 0.9rem;
    font-weight: 700;
    @apply text-gray-100;
  }

  span {
    @apply text-gray-500;
    font-size: 0.72rem;
    line-height: 1.3;
  }
}

.cardMeta {
  flex: none;
  display: flex;
  align-items: center;
}

.kbd {
  @apply text-gray-200 bg-gray-800;
  border: 2px solid theme("colors.gray.700");
  border-bottom-width: 4px;
  border-radius: 0.5rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.status {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  @apply text-gray-500;
}

.statusOn {
  color: #ff8fd0;
}

.empty {
  grid-column: 1 / -1;
  @apply text-gray-500;
  text-align: center;
  padding: 2rem 1rem;
  font-size: 0.82rem;
}

/* footer */
.foot {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem;
  border-top: 2px dashed theme("colors.gray.700");
}

.pasteWrap {
  flex: 1;
  min-width: 0;
}

.editRow {
  flex: 1;
  @apply text-gray-100;
}

.pasteBox {
  display: block;
  width: 100%;
  resize: none;
  border-radius: 0.8rem;
  padding: 0.5rem 0.9rem;
  font-size: 0.78rem;
  @apply text-gray-200;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.06);
  outline: none;

  &::placeholder {
    @apply text-gray-500;
  }

  &:focus {
    border-color: rgba(199, 125, 255, 0.5);
  }
}

.footRight {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: none;
}

.addBtn {
  @apply text-gray-300 bg-gray-800 rounded-lg;
  border: 2px solid theme("colors.gray.700");
  padding: 0.35rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;

  &:hover {
    @apply text-gray-100;
    background: theme("colors.gray.700");
  }
}

.addItem {
  text-align: left;
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

.hint {
  @apply text-gray-500;
  font-size: 0.66rem;
  white-space: nowrap;
}

/* recent whispers */
.whisperSection {
  border-top: 2px dashed theme("colors.gray.700");
  padding: 0.5rem 0.9rem 0.3rem;
  max-height: 12rem;
  overflow-y: auto;
}

.whisperHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  @apply text-gray-500;
  margin-bottom: 0.35rem;
}

.whisperClear {
  font-size: 0.62rem;
  font-weight: 700;
  @apply text-gray-500;

  &:hover {
    color: #fff;
  }
}

.whisperList {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.whisperRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.6rem;
  background: rgba(255, 255, 255, 0.04);
}

.whisperTxt {
  flex: 1;
  min-width: 0;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  b {
    color: #fff;
    font-weight: 700;
    margin-right: 0.35rem;
  }

  span {
    @apply text-gray-400;
  }
}

.whisperBtn {
  flex: none;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
}

.whisperBtn2 {
  flex: none;
  font-size: 0.68rem;
  font-weight: 700;
  @apply text-gray-300;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 2px solid theme("colors.gray.700");

  &:hover {
    color: #fff;
  }
}

.whisperDone {
  opacity: 0.5;
}

.statusTag {
  flex: none;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 999px;
}

.st_invited {
  color: #ffd166;
  background: rgba(255, 209, 102, 0.14);
}

.st_sold {
  color: #59d97a;
  background: rgba(89, 217, 122, 0.16);
}

.st_gone {
  color: #ff8f9f;
  background: rgba(255, 95, 160, 0.14);
}

/* recent checks */
.historySection {
  border-top: 2px dashed theme("colors.gray.700");
  padding: 0.5rem 0.9rem 0.3rem;
  max-height: 9rem;
  overflow-y: auto;
}

.checkList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.checkRow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem 0.2rem 0.3rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid transparent;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease,
    transform 0.1s ease;

  &:hover {
    border-color: rgba(199, 125, 255, 0.5);
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }
}

.checkIcon {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  flex: none;
}

.checkName {
  font-size: 0.72rem;
  font-weight: 700;
  max-width: 11rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* recent deaths */
.deathList {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.deathRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 95, 160, 0.06);
}

.deathIcon {
  color: #ff8f9f;
  font-size: 0.65rem;
}

.deathZone {
  flex: 1;
  @apply text-gray-300;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deathTime {
  @apply text-gray-500;
  font-size: 0.68rem;
  white-space: nowrap;
}

/* first-run onboarding */
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.6rem 1.4rem 1.4rem;
  overflow-y: auto;
}

.welcomeLogo {
  width: 4.4rem;
  height: 4.4rem;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.6));
  animation: bob 3.2s ease-in-out infinite;
}

@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.welcomeTitle {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0.7rem 0 0.3rem;
  color: #fff;
}

.welcomeLead {
  @apply text-gray-500;
  font-size: 0.82rem;
  margin-bottom: 0.9rem;
}

.detected {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #59d97a;
  background: rgba(89, 217, 122, 0.1);
  border: 2px solid rgba(89, 217, 122, 0.35);
  border-radius: 999px;
  padding: 0.3rem 0.85rem;
  margin-bottom: 1.1rem;
}

.trio {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  width: 100%;
  margin-bottom: 1.2rem;
}

.trioCard {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid theme("colors.gray.700");
  border-radius: 0.9rem;
  padding: 0.75rem;

  b {
    font-size: 0.82rem;
    @apply text-gray-100;
  }

  span {
    font-size: 0.7rem;
    @apply text-gray-500;
    line-height: 1.3;
  }
}

.trioIc {
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}

.trioKbd {
  display: inline-block;
  align-self: flex-start;
  @apply text-gray-200 bg-gray-800;
  border: 2px solid theme("colors.gray.700");
  border-bottom-width: 4px;
  border-radius: 0.5rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.welcomeBtn {
  color: #fff;
  font-weight: 800;
  font-size: 0.9rem;
  padding: 0.6rem 1.3rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
  box-shadow: 0 8px 22px -6px rgba(255, 95, 176, 0.55);
  transition:
    transform 0.1s ease,
    filter 0.12s ease;

  &:hover {
    filter: brightness(1.08);
  }

  &:active {
    transform: scale(0.97);
  }
}
</style>
