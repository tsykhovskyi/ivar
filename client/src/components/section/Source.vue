<script setup lang="ts">
import type { Line } from '@/api/api';
import { api } from '@/api';
import { onMounted, onUpdated } from 'vue';

const props = defineProps<{
  lines: Line[];
}>();

let currentLine: number | null = null;
onMounted(() => {
  scroll();
});
onUpdated(() => {
  scroll();
});

function lineClicked(line: Line) {
  if (line.isBreakpoint) {
    api.removeBreakpoint(line.number);
  } else {
    api.addBreakpoint(line.number);
  }
}

function scroll() {
  if (!Array.isArray(props.lines)) {
    return;
  }
  const newCurrentLine = props.lines.findIndex((l) => l.isCurrent);
  if (newCurrentLine !== currentLine) {
    const line = document.getElementsByClassName('current-line')[0];
    const content = document.getElementsByClassName('source')[0];
    if (!line || !content || !content.parentElement) {
      return;
    }
    const { top: lineTop } = line.getBoundingClientRect();
    const { top: contentTop } = content.getBoundingClientRect();
    const { height: boxHeight, top: boxTop } =
      content.parentElement.getBoundingClientRect();

    if (content) {
      content.parentElement.scrollTop =
        lineTop - contentTop - boxHeight / 2 + boxTop;
    }
  }
  currentLine = newCurrentLine;
}
</script>

<template>
  <div class="box full-height py-0 px-0" style="overflow-y: auto">
    <div class="content code source">
      <div v-for="line in lines" class="line">
        <div class="line-number" @click="lineClicked(line)">
          <div style="display: flex; justify-content: space-between">
            <span>{{ line.number }}</span>
            <span v-show="line.isBreakpoint">&#128308;</span>
          </div>
        </div>
        <span
          class="line-content"
          :class="{
            'current-line': line.isCurrent,
            breakpoint: line.isBreakpoint,
          }"
          >{{ line.content }}</span
        >
      </div>
    </div>
  </div>
</template>

<style></style>
