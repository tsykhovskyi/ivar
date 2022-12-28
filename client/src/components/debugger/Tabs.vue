<script setup lang="ts">
import type { Session } from '@/api/types/debugger';
import { DebuggerState } from '@/api/types/debugger';

defineProps<{
  sessions: Session[];
  activeSession: string | null;
}>();
defineEmits<{
  (e: 'onSessionToggle', sessionId: string): void;
  (e: 'onSessionClose', sessionId: string): void;
}>();

function stateToIcon(state: DebuggerState) {
  switch (state) {
    case DebuggerState.Running:
      return 'fa-play';
    case DebuggerState.Pending:
      return 'fa-pause';
  }
  return 'fa-circle';
}
</script>

<template>
  <div class="tabs is-boxed is-small" v-if="sessions">
    <ul>
      <li
        v-for="session in sessions"
        class="is-small"
        :class="{ 'is-active': activeSession === session.id }"
      >
        <a @click="$emit('onSessionToggle', session.id)">
          <span class="icon is-small">
            <i class="fa-solid" :class="stateToIcon(session.state)"></i>
          </span>
          <span>{{ session.id }}</span>
          <span>
            <button
              class="delete"
              @click="$emit('onSessionClose', session.id)"
            ></button>
          </span>
        </a>
      </li>
    </ul>
  </div>
</template>
