<script setup lang="ts">
import Card from "@/components/ui/card.vue";
import CardHeader from "@/components/ui/card-header.vue";
import CardTitle from "@/components/ui/card-title.vue";
import CardDescription from "@/components/ui/card-description.vue";
import CardContent from "@/components/ui/card-content.vue";
import { config } from "@/web/settings";
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-lg font-semibold tracking-tight text-foreground">Help</h1>
      <p class="mt-1 text-[13px] text-muted-foreground">
        Short answers to the usual problems.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Your hotkeys</CardTitle>
        <CardDescription>Current bindings.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-muted-foreground">Price check</span>
          <kbd class="rounded border border-border bg-background px-2 py-0.5 text-[11px]">{{
            config.priceCheckHotkey
          }}</kbd>
        </div>
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-muted-foreground">Show / hide overlay</span>
          <kbd class="rounded border border-border bg-background px-2 py-0.5 text-[11px]">{{
            config.overlayHotkey
          }}</kbd>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
