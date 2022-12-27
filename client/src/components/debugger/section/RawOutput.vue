<script setup lang="ts">
defineProps<{
  content: string[] | null;
}>();
</script>

<template>
  <div class="content code" v-if="content">
    <p v-for="row in content">{{ row }}</p>
  </div>
</template>
