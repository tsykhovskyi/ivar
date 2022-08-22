<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Source from './section/Source.vue';
import Watch from './section/Watch.vue';
import RawOutput from './section/RawOutput.vue';
import { Api } from "@/api";


const response = ref({
  cmdResponse: '',
  sourceCode: [],
  variables: [],
  trace: '',
});

const ACTIONS = {
  INIT: 'init',
  STEP: 'step',
  CONTINUE: 'continue',
  ABORT: 'abort',
  RESTART: 'restart',
  ADD_BREAKPOINT: 'add-breakpoint',
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'F8') {
    exec(ACTIONS.STEP);
  }
  if (event.code === 'F9') {
    exec(ACTIONS.CONTINUE);
  }
}, false);

onMounted(() => exec(ACTIONS.INIT));

// window.onload = () => exec(ACTIONS.INIT);
// // check debugger status
// setInterval(async () => {
//   const data = await fetch('/check');
//   const response = await data.json();
//   if (response.sessionActive === false) {
//     location.reload();
//   }
// }, 1000)

const api = new Api();
async function exec(command: string, argument: string[] = []) {
  response.value = await api.sendCommand(command, argument);
}

</script>

<template>
  <div class="nav">
    <button id="step-btn" @click="exec(ACTIONS.STEP)">Step(F8)</button>
    <button id="continue-btn" @click="exec(ACTIONS.CONTINUE)">Continue(F9)</button>
    <button id="abort-btn" @click="exec(ACTIONS.ABORT)">Abort</button>
    <button id="restart-btn" @click="exec(ACTIONS.RESTART)">Restart</button>
  </div>
  <div class="container">
    <Source :lines="response.sourceCode"
            @addBreakpoint="exec(ACTIONS.ADD_BREAKPOINT, [$event])"
            @removeBreakpoint="exec(ACTIONS.ADD_BREAKPOINT, ['-'+$event])"
    />
    <Watch :variables="response.variables"/>
    <RawOutput :content="response.cmdResponse"></RawOutput>
    <RawOutput :content="response.trace"></RawOutput>
  </div>
</template>
