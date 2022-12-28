<script setup lang="ts">
import { onMounted, ref } from 'vue';

type Option = {
  name: string;
  label: string;
}

const props = defineProps<{
  options: Option[] | string[],
  selected?: string,
}>();

const selectedOption = ref<string | null>(null);

const getOptions = () => {
  return props.options.map(option => typeof option === 'string' ? {
    name: option,
    label: option[0].toUpperCase() + option.substring(1),
  } : option);
};

const $emit = defineEmits<{
  (e: 'change', name: string): void;
}>();

const click = (option: Option) => {
  selectedOption.value = option.name;
  $emit('change', option.name);
};

const isSelected = (option: Option) => option.name === selectedOption.value;

onMounted(() => {
  selectedOption.value = props.selected ?? null;
});
</script>

<template>
  <div class="control buttons has-addons">
    <button class="button is-small"
            v-for="option of getOptions()"
            :class="{'is-success': isSelected(option)}"
            @click="click(option)"
    >{{ option.label }}
    </button>
  </div>
</template>
