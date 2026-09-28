<script setup lang="ts">
import { BarChart3 } from "lucide-vue-next";
import Card from "@/components/ui/card.vue";
import CardHeader from "@/components/ui/card-header.vue";
import CardTitle from "@/components/ui/card-title.vue";
import CardDescription from "@/components/ui/card-description.vue";
import CardContent from "@/components/ui/card-content.vue";
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-lg font-semibold tracking-tight text-foreground">Insights</h1>
      <p class="mt-1 text-[13px] text-muted-foreground">
        Where your time and currency actually go.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Checks and whispers over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border"
        >
          <BarChart3 class="size-4 text-muted-foreground" />
          <p class="text-[13px] text-muted-foreground">No data yet</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
