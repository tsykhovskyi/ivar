<script setup lang="ts">
defineProps<{
  watch: {
    name: string;
    value: string | null;
  }[];
  variables: {
    name: string;
    value: string;
  }[];
}>();


</script>

<template>
  <div class="content code vars">
    <span v-for="variable in watch">
      <span class="var-name">{{ variable.name }}</span>
      <span>=</span>
      <span class="var-value" v-if="variable.value !== null">
        {{ variable.value }}
      </span>
      <span class="var-value-invalid" v-if="variable.value === null">
        (No such variable)
      </span>
    </span>
    <hr>
    <span v-for="variable in variables">
      <span class="var-name">{{ variable.name }}</span>
      <span>=</span>
      <span class="var-value">
        {{ variable.value }}
      </span>
    </span>
  </div>
</template>
