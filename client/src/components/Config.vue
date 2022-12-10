<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { ServerConfig } from '@/api/api';
import { api } from '@/api';

const config = ref<ServerConfig>({
  intercept: true,
  syncMode: true,
  scriptFilters: [],
  server: { title: 'IVAR', version: '0.0.0' },
});

onMounted(async () => {
  config.value = await api.config();
});

const updateConfig = async () => {
  const data: ServerConfig = {
    ...config.value,
    scriptFilters: config.value.scriptFilters.filter((s) => s !== ''),
  };
  await api.updateConfig(data);
};

const toggleIntercept = () => {
  config.value.intercept = !config.value.intercept;
  updateConfig();
};

const toggleSyncMode = () => {
  config.value.syncMode = !config.value.syncMode;
  updateConfig();
};

const addFilter = () => {
  config.value.scriptFilters.push('');
};
const setFilter = (index: number, value: string) => {
  config.value.scriptFilters[index] = value;
};
const deleteFilter = (index: number) => {
  config.value.scriptFilters.splice(index, 1);
  updateConfig();
};
</script>

<template>
  <div class="buttons is-right">
    <button
      class="button is-small is-dark"
      :class="{ 'is-success': config.intercept }"
      @click="toggleIntercept"
    >
      <span class="icon">
        <i class="fa-solid fa-bug"></i>
      </span>
    </button>
    <button
      class="button is-small is-dark js-modal-trigger"
      data-target="debugger-config-modal"
    >
      <span class="icon">
        <i class="fa-solid fa-gear"></i>
      </span>
    </button>
    <button
      class="button is-small is-dark js-modal-trigger"
      data-target="debugger-info"
    >
      <span class="icon">
        <i class="fa-solid fa-info"></i>
      </span>
    </button>
  </div>

  <div id="debugger-config-modal" class="modal">
    <div class="modal-background"></div>

    <div class="modal-content">
      <div class="box">
        <div class="field is-grouped">
          <div class="control is-expanded">
            <label class="label">Debugger enabled</label>
          </div>
          <div class="control buttons has-addons">
            <button
              class="button is-small"
              :class="{ 'is-success': config.intercept }"
              @click="toggleIntercept"
            >
              ON
            </button>
            <button
              class="button is-small"
              :class="{ 'is-danger': !config.intercept }"
              @click="toggleIntercept"
            >
              OFF
            </button>
          </div>
        </div>
        <div class="field is-grouped">
          <div class="control is-expanded">
            <label class="label">LDB sync mode</label>
          </div>
          <div class="control buttons has-addons">
            <button
              class="button is-small"
              :class="{ 'is-success': config.syncMode }"
              @click="toggleSyncMode"
            >
              ON
            </button>
            <button
              class="button is-small"
              :class="{ 'is-danger': !config.syncMode }"
              @click="toggleSyncMode"
            >
              OFF
            </button>
          </div>
        </div>
        <div class="content">
          <label class="label">Filters</label>
          <p>
            <small
              ><i class="fa fa-info-circle"></i> Will intercept only script that
              has next matches. If no filter provided then all scripts will be
              intercepted</small
            >
          </p>
          <div
            class="field has-addons"
            v-for="(filter, i) in config.scriptFilters"
          >
            <div class="control is-expanded">
              <input
                :value="filter"
                @input="(event) => setFilter(i, event.target.value)"
                @change="updateConfig"
                class="input is-small"
                type="text"
                placeholder="Script filter"
              />
            </div>
            <div class="control">
              <a class="button is-dark is-small" @click="deleteFilter(i)">X</a>
            </div>
          </div>
          <div class="field has-addons">
            <button class="button is-primary is-small" @click="addFilter">
              Add script filter
            </button>
          </div>
        </div>
      </div>
    </div>

    <button class="modal-close is-large" aria-label="close"></button>
  </div>

  <div id="debugger-info" class="modal">
    <div class="modal-background"></div>

    <div class="modal-content">
      <div class="box">
        <p class="subtitle is-4">
          IVAR - Lua in Redis debugger and monitoring tool
        </p>
        <p>Version: {{ config.server.version }}</p>
      </div>
    </div>

    <button class="modal-close is-large" aria-label="close"></button>
  </div>
</template>
