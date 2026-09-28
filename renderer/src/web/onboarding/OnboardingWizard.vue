<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ArrowRight,
  Check,
  FileText,
  Keyboard,
  Layers,
  Sparkles,
} from "lucide-vue-next";
import Button from "@/components/ui/button.vue";
import Badge from "@/components/ui/badge.vue";
import Input from "@/components/ui/input.vue";
import Label from "@/components/ui/label.vue";
import Switch from "@/components/ui/switch.vue";
import { cn } from "@/lib/utils";
import { updateConfig, type Language } from "@/web/settings";

/* A four-step wizard. Each step is a plain object so the flow is data, not
   markup — adding a step is one entry, not a new template branch. */
const steps = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to POE Kitten",
    body: "An overlay for Path of Exile 2 that prices your items, reads trade whispers and stays out of your way.",
  },
  {
    id: "league",
    icon: Layers,
    title: "Pick your league",
    body: "Prices come from the league you play in. You can change this any time in Settings.",
  },
  {
    id: "hotkeys",
    icon: Keyboard,
    title: "Choose your hotkeys",
    body: "These work while the game is focused. Pick something you won't hit by accident.",
  },
  {
    id: "log",
    icon: FileText,
    title: "Turn on the client log",
    body: "Optional, but it powers trade whispers, death and level-up notifications.",
  },
] as const;

const step = ref(0);
const total = steps.length;
const done = computed(() => step.value >= total - 1);

const league = ref("");
const pcKey = ref("Ctrl + F6");
const overlayKey = ref("Shift + Space");
const readLog = ref(true);
const language = ref<Language>("en");

function next() {
  if (!done.value) {
    step.value += 1;
    return;
  }
  finish();
}

function back() {
  if (step.value > 0) step.value -= 1;
}

function finish() {
  updateConfig({
    onboarded: true,
    leagueId: league.value.trim() || null,
    priceCheckHotkey: pcKey.value,
    overlayHotkey: overlayKey.value,
    readClientLog: readLog.value,
    language: language.value,
  });
}
</script>

<template>
  <div class="grid h-full place-items-center bg-background p-8">
    <div class="w-full max-w-md animate-fade-up">
      <!-- step rail -->
      <div class="mb-6 flex items-center gap-1.5">
        <div
          v-for="(s, i) in steps"
          :key="s.id"
          :class="
            cn(
              'h-0.5 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-primary' : 'bg-border',
            )
          "
        />
      </div>

      <div class="mb-1 flex items-center gap-2">
        <component :is="steps[step].icon" class="size-4 text-muted-foreground" />
        <Badge variant="muted">Step {{ step + 1 }} of {{ total }}</Badge>
      </div>

      <h1 class="mt-3 text-xl font-semibold tracking-tight text-foreground">
        {{ steps[step].title }}
      </h1>
      <p class="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
        {{ steps[step].body }}
      </p>

      <!-- per-step controls -->
      <div class="mt-6">
        <template v-if="steps[step].id === 'league'">
          <Label for="league">League</Label>
          <Input
            id="league"
            v-model="league"
            class="mt-2"
            placeholder="e.g. Dawn of the Hunt"
          />
        </template>

        <template v-else-if="steps[step].id === 'hotkeys'">
          <div class="flex flex-col gap-4">
            <div>
              <Label for="pc-key">Price check an item</Label>
              <Input id="pc-key" v-model="pcKey" class="mt-2 font-mono" />
            </div>
            <div>
              <Label for="ov-key">Show / hide the overlay</Label>
              <Input id="ov-key" v-model="overlayKey" class="mt-2 font-mono" />
            </div>
          </div>
        </template>

        <template v-else-if="steps[step].id === 'log'">
          <div
            class="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div>
              <p class="text-[13px] font-medium text-foreground">Read client log</p>
              <p class="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Watches PoE2's log for whispers, deaths and level-ups.
              </p>
            </div>
            <Switch v-model="readLog" />
          </div>
        </template>

        <template v-else>
          <ul class="flex flex-col gap-2.5">
            <li
              v-for="f in [
                'Price any item with one keypress',
                'Live listings with a median price',
                'Whisper buyers without leaving the game',
                'A session HUD that stays on screen',
              ]"
              :key="f"
              class="flex items-center gap-2.5 text-[13px] text-muted-foreground"
            >
              <Check class="size-3.5 shrink-0 text-foreground" />
              {{ f }}
            </li>
          </ul>
        </template>
      </div>

      <!-- actions -->
      <div class="mt-8 flex items-center gap-2">
        <Button v-if="step > 0" variant="ghost" size="sm" @click="back">
          Back
        </Button>
        <Button class="ml-auto" @click="next">
          {{ done ? "Start trading" : "Continue" }}
          <ArrowRight v-if="!done" />
        </Button>
      </div>
    </div>
  </div>
</template>
