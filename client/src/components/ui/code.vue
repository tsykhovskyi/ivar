<script setup lang="ts">

defineProps<{ code: string }>();

</script>

<template>
  <pre style="white-space: break-spaces" class="code is-fullwidth has-background-grey-darker">{{ code }}</pre>
</template>
