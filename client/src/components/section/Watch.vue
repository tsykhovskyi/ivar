<script setup lang="ts">
defineProps<{
  variables: {
    name: string;
    value: string;
  }[]
}>();
</script>

<template>
  <div class="content code vars">
    <span v-for="variable in variables">
      <span class="var-name">{{ variable.name }}</span>
      <span>=</span>
      <span class="var-value">{{ variable.value }}</span>
    </span>
  </div>
</template>
