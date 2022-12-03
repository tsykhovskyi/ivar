<script setup lang="ts">
import { api } from '@/api';
import { ref } from 'vue';

const props = defineProps<{
  watch: {
    name: string;
    value: string | null;
  }[];
  variables: {
    name: string;
    value: string;
  }[];
}>();

const newWatch = ref<string>('');
const addWatch = async () => {
  const watchName = newWatch.value.trim().split(' ')[0];
  if (watchName !== '' && !props.watch.find(w => w.name === watchName)) {
    await api.addWatch(watchName);
  }
  newWatch.value = '';
};

const deleteWatch = async (name: string) => {
  await api.removeWatch(name);
}

</script>

<template>
  <div class="content code vars">
    <div class="field has-addons">
      <div class="control is-expanded">
        <input class="input is-small"
               v-model="newWatch"
               @keyup.enter="addWatch"
               placeholder="Add watch variable"
        >
      </div>
      <div class="control">
        <a class="button is-dark is-small" @click="addWatch"><i class="fa fa-plus"></i></a>
      </div>
    </div>

    <div class="field has-addons" v-for="variable in watch">
      <div class="control is-expanded variable">
          <span class="name">{{ variable.name }}</span>
          <span>=</span>
          <span class="value" v-if="variable.value !== null">
            {{ variable.value }}
          </span>
          <span class="value-invalid" v-if="variable.value === null">
            (No such variable)
          </span>
      </div>
      <div class="control">
        <a class="has-text-white" @click="deleteWatch(variable.name)"><i class="fa fa-close"></i></a>
      </div>
    </div>

    <hr>
    <span v-for="variable in variables" class="variable">
      <span class="name">{{ variable.name }}</span>
      <span>=</span>
      <span class="value">
        {{ variable.value }}
      </span>
    </span>
  </div>
</template>
