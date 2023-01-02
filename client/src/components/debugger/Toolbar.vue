<script setup lang="ts">
import { api } from '@/api';
import { onMounted } from 'vue';

defineProps<{
  isActive: boolean;
}>();

onMounted(() => {
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.code === 'F8') {
        api.step();
      }
      if (event.code === 'F9') {
        api.continue();
      }
    },
    false
  );
});
</script>

<template>
  <div class="columns pt-2">
    <div class="column is-three-fifths buttons has-addons">
      <button class="button is-small" :disabled="!isActive" @click="api.step()">
        <span class="icon">
          <i class="fa-solid fa-forward-step"></i>
        </span>
        <span>Step(F8)</span>
      </button>
      <button
        class="button is-small"
        :disabled="!isActive"
        @click="api.continue()"
      >
        <span class="icon">
          <i class="fa-solid fa-play"></i>
        </span>
        <span>Continue(F9)</span>
      </button>
      <button
        class="button is-small is-danger"
        :disabled="!isActive"
        @click="api.abort()"
      >
        <span class="icon">
          <i class="fa-solid fa-stop"></i>
        </span>
        <span>Abort</span>
      </button>
      <button
        class="button is-small"
        :disabled="!isActive"
        @click="api.restart()"
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
