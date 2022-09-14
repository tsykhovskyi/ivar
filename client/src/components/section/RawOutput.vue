<script setup lang="ts">
defineProps<{
  content: string | null;
}>();
</script>

<template>
  <div class="content code" v-html="content"></div>
</template>
