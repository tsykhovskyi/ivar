<script setup lang="ts">
import Source from './section/Source.vue';
import Watch from './section/Watch.vue';
import RawOutput from './section/RawOutput.vue';
import Code from '../ui/code.vue';

import type { DebuggerResponse } from '@/api/debugger/debugger';
import { DebuggerState } from '@/api/debugger/debugger';

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
        <td><Code :code="debuggerResponse.result"></Code></td>
      </div>
    </div>
  </div>

  <div v-if="isError()">
    <div class="box has-background-danger">
      <div class="content">
        <h4>Session failed</h4>
        <td><Code :code="debuggerResponse.error"></Code></td>
      </div>
    </div>
  </div>
</template>
