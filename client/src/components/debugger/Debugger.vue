<script setup lang="ts">
import Source from './section/Source.vue';
import Watch from './section/Watch.vue';
import RawOutput from './section/RawOutput.vue';
import Code from '../ui/code.vue';

import type { DebuggerResponse, ErrorResponse, FinishedResponse, RunningResponse } from '@/api/debugger/debugger';
import { DebuggerState } from '@/api/debugger/debugger';

defineProps<{
  debuggerResponse?: DebuggerResponse | null;
}>();

const isRunning = (response: DebuggerResponse): response is RunningResponse => {
  return response && response.state === DebuggerState.Running;
};

const isFinished = (response: DebuggerResponse): response is FinishedResponse => {
  return response && response.state === DebuggerState.Finished;
};

const isError = (response: DebuggerResponse): response is ErrorResponse => {
  return response && response.state === DebuggerState.Error;
};
</script>

<template v-if="debuggerResponse">
  <div v-if="isRunning(debuggerResponse)" class="columns full-height">
    <div class="column is-three-fifths">
      <Source :lines="debuggerResponse.sourceCode"/>
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

  <div v-if="isFinished(debuggerResponse)">
    <div class="box">
      <div class="content">
        <h4>Session finished</h4>
        <h5>Result:</h5>
        <Code :code="debuggerResponse.result.value"></Code>
      </div>
    </div>
  </div>

  <div v-if="isError(debuggerResponse)">
    <div class="box has-background-danger">
      <div class="content">
        <h4>Session failed</h4>
        <Code :code="debuggerResponse.error"></Code>
      </div>
    </div>
  </div>
</template>
