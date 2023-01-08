<script setup lang="ts">
import { api } from '@/api';
import { onDeactivated, onMounted, onUnmounted } from 'vue';

defineProps<{
  isActive: boolean;
}>();

const keydownHandler = (event: KeyboardEvent) => {
  if (event.code === 'F8') {
    api.debugger.step();
  }
  if (event.code === 'F9') {
    api.debugger.continue();
  }
};

onMounted(() => {
  document.addEventListener(
    'keydown',
    keydownHandler,
    false,
  );
});

onUnmounted(() => {
  document.removeEventListener('keydown', keydownHandler);
})
</script>

<template>
  <div class="columns pt-2">
    <div class="column is-three-fifths buttons has-addons">
      <button class="button is-small" :disabled="!isActive" @click="api.debugger.step()">
        <span class="icon">
          <i class="fa-solid fa-forward-step"></i>
        </span>
        <span>Step(F8)</span>
      </button>
      <button
        class="button is-small"
        :disabled="!isActive"
        @click="api.debugger.continue()"
      >
        <span class="icon">
          <i class="fa-solid fa-play"></i>
        </span>
        <span>Continue(F9)</span>
      </button>
      <button
        class="button is-small is-danger"
        :disabled="!isActive"
        @click="api.debugger.abort()"
      >
        <span class="icon">
          <i class="fa-solid fa-stop"></i>
        </span>
        <span>Abort</span>
      </button>
      <button
        class="button is-small"
        :disabled="!isActive"
        @click="api.debugger.restart()"
      >
        <span class="icon">
          <i class="fa-solid fa-arrow-rotate-right"></i>
        </span>
        <span>Restart</span>
      </button>
    </div>
  </div>
</template>

<style scoped></style>
