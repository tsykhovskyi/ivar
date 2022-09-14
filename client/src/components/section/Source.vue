<script setup lang="ts">
import type { Line } from "@/api/api";

defineProps<{
  lines: Line[];
}>();

defineEmits<{
  (e: 'addBreakpoint', line: number): void;
  (e: 'removeBreakpoint', line: number): void;
}>();
</script>

<template>
  <div class="content code source">
    <span v-for="line in lines"
          @click="line.isBreakpoint ? $emit('removeBreakpoint', line.number) : $emit('addBreakpoint', line.number)"
          :class="{'current': line.isCurrent, breakpoint: line.isBreakpoint}"
    >{{ line.content }}</span>
  </div>
</template>
