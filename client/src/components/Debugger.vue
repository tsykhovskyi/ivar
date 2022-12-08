<script setup lang="ts">
import Source from './section/Source.vue';
import Watch from './section/Watch.vue';
import RawOutput from './section/RawOutput.vue';
import type { DebuggerResponse } from "@/api/api";
import { DebuggerState } from "@/api/api";

const props = defineProps<{
  debuggerResponse?: DebuggerResponse | null;
}>();

const isRunning = () => {
  return props.debuggerResponse && props.debuggerResponse.state === DebuggerState.Running
}

</script>

<template v-if="debuggerResponse">
  <div v-if="isRunning()" class="columns full-height">
    <div class="column is-three-fifths">
      <Source :lines="debuggerResponse.sourceCode"/>
    </div>
    <div class="column" style="display: grid; grid-template-rows: 3fr 1fr 1fr;">
      <div class="box" style="overflow-y: auto;">
        <Watch :watch="debuggerResponse.watch" :variables="debuggerResponse.variables"/>
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
