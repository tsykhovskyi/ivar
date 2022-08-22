<script setup lang="ts">
defineProps<{
  content: string;
}>()
</script>

<template>
  <div class="code" v-html="content"></div>
</template>
