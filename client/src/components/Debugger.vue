<script setup lang="ts">
import Source from './section/Source.vue';
import Watch from './section/Watch.vue';
import RawOutput from './section/RawOutput.vue';
import type { DebuggerResponse } from "@/api/api";

defineProps<{
  debuggerResponse?: DebuggerResponse | null;
}>();

</script>

<template>
  <div v-if="debuggerResponse" class="columns full-height">
    <div class="column is-three-fifths">
      <div class="box full-height" style="overflow-y: auto">
        <Source :lines="debuggerResponse.sourceCode"/>
      </div>
    </div>
    <div class="column" style="display: grid; grid-template-rows: 3fr 1fr 1fr;">
      <div class="box" style="overflow-y: auto;">
        <Watch :variables="debuggerResponse.variables"/>
      </div>
      <div class="box" style="overflow-y: auto;">
        <RawOutput :content="debuggerResponse.cmdResponse"></RawOutput>
      </div>
      <div class="box" style="overflow-y: auto;">
        <RawOutput :content="debuggerResponse.trace"></RawOutput>
      </div>
    </div>
  </div>
</template>
