<script setup lang="ts">
defineProps<{
  isActive: boolean,
}>();
const emits = defineEmits<{
  (e: 'action', action: ACTION): void;
}>();

enum ACTION {
  STEP = 'step',
  CONTINUE = 'continue',
  ABORT = 'abort',
  RESTART = 'restart'
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'F8') {
    emits('action', ACTION.STEP);
  }
  if (event.code === 'F9') {
    emits('action', ACTION.CONTINUE);
  }
}, false);
</script>

<template>
  <div class="is-widescreen buttons has-addons">
    <button class="button is-small" :disabled="!isActive" @click="$emit('action', ACTION.STEP)">
      <span class="icon">
        <i class="fa-solid fa-forward-step"></i>
      </span>
      <span>Step(F8)</span>
    </button>
    <button class="button is-small" :disabled="!isActive" @click="$emit('action', ACTION.CONTINUE)">
      <span class="icon">
        <i class="fa-solid fa-play"></i>
      </span>
      <span>Continue(F9)</span>
    </button>
    <button class="button is-small is-danger" :disabled="!isActive" @click="$emit('action', ACTION.ABORT)">
      <span class="icon">
        <i class="fa-solid fa-stop"></i>
      </span>
      <span>Abort</span>
    </button>
    <button class="button is-small" :disabled="!isActive" @click="$emit('action', ACTION.RESTART)">
      <span class="icon">
        <i class="fa-solid fa-arrow-rotate-right"></i>
      </span>
      <span>Restart</span>
    </button>
  </div>
</template>

<style scoped>

</style>
