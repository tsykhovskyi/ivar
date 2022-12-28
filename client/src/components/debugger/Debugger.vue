<script setup lang="ts">
import Source from './section/Source.vue';
import Watch from './section/Watch.vue';
import RawOutput from './section/RawOutput.vue';
import type { DebuggerResponse } from '@/api/types/debugger';
import { DebuggerState } from '@/api/types/debugger';

const props = defineProps<{
  debuggerResponse?: DebuggerResponse | null;
}>();

const isRunning = () => {
  return (
    props.debuggerResponse &&
    props.debuggerResponse.state === DebuggerState.Running
  );
};

const isFinished = () => {
  return props.debuggerResponse && props.debuggerResponse.state === DebuggerState.Finished;
};

const isError = () => {
  return props.debuggerResponse && props.debuggerResponse.state === DebuggerState.Error;
}

const pretty = (result: unknown) => {
  return JSON.stringify(result, null, 4);
};
</script>

<template v-if="debuggerResponse">
  <div v-if="isRunning()" class="columns full-height">
    <div class="column is-three-fifths">
      <Source :lines="debuggerResponse.sourceCode" />
    </div>
    <div class="column" style="display: grid; grid-template-rows: 3fr 1fr 1fr">
      <div class="box" style="overflow-y: auto">
        <Watch
          :watch="debuggerResponse.watch"
          :variables="debuggerResponse.variables"
        />
      </div>
      <div class="box" style="overflow-y: auto">
        <RawOutput :content="debuggerResponse.cmdResponse"></RawOutput>
      </div>
      <div class="box" style="overflow-y: auto">
        <RawOutput :content="debuggerResponse.trace"></RawOutput>
      </div>
    </div>
  </div>

  <div v-if="isFinished()">
    <div class="box">
      <div class="content">
        <h4>Session finished</h4>
        <h5>Result:</h5>
        <pre>{{ pretty(debuggerResponse.result) }}</pre>
      </div>
    </div>
  </div>

  <div v-if="isError()">
    <div class="box has-background-danger">
      <div class="content">
        <h4>Session failed</h4>
        <p>Error: {{ debuggerResponse.error }}</p>
      </div>
    </div>
  </div>
</template>
