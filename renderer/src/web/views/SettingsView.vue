<script setup lang="ts">
import { Settings2 } from "lucide-vue-next";
import Card from "@/components/ui/card.vue";
import CardHeader from "@/components/ui/card-header.vue";
import CardTitle from "@/components/ui/card-title.vue";
import CardDescription from "@/components/ui/card-description.vue";
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-lg font-semibold tracking-tight text-foreground">Settings</h1>
      <p class="mt-1 text-[13px] text-muted-foreground">
        Hotkeys, alerts and overlay behaviour.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Settings2 class="size-4" /> Coming next
        </CardTitle>
        <CardDescription>
          Flat, sectioned settings — no widget tree to navigate.
        </CardDescription>
      </CardHeader>
    </Card>
  </div>
</template>
