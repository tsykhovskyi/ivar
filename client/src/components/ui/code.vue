<script setup lang="ts">

defineProps<{ code: string }>();

const nl2br = (v: string): string => {
  const res = v.replace(/\r?\n/g, '<br/>');
  return res;
}
</script>

<template>
  <pre class="code">{{ code }}</pre>
</template>
