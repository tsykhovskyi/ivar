<script setup lang="ts">
defineProps<{
  content: string | null;
}>();
</script>

<template>
  <div class="code" v-html="content"></div>
</template>
