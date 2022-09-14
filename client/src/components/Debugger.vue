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
      <div class="full-height" style="overflow-y: auto">
        <Source :lines="debuggerResponse.sourceCode"
                @addBreakpoint="exec('ADD_BREAKPOINT', [$event])"
                @removeBreakpoint="exec('ADD_BREAKPOINT', ['-'+$event])"
        />
      </div>
    </div>
    <div class="column">
      <Watch :variables="debuggerResponse.variables"/>
      <RawOutput :content="debuggerResponse.cmdResponse"></RawOutput>
      <RawOutput :content="debuggerResponse.trace"></RawOutput>
    </div>
  </div>
</template>
