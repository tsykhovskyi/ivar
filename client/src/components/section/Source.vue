<script setup lang="ts">
import type { Line } from "@/api/api";
import { api } from "@/api";
import { onMounted, onUpdated } from "vue";

const props = defineProps<{
  lines: Line[];
}>();

let currentLine: number | null = null;
onMounted(() => {
  scroll();
})
onUpdated(() => {
  scroll();
});

function lineClicked(line: Line) {
  if (line.isBreakpoint) {
    api.removeBreakpoint(line.number)
  } else {
    api.addBreakpoint(line.number)
  }
}

function scroll() {
  if (!Array.isArray(props.lines)) {
    return;
  }
  const newCurrentLine = props.lines.findIndex(l => l.isCurrent);
  if (newCurrentLine !== currentLine) {
    const line = document.getElementsByClassName('has-background-info')[0];
    const content = document.getElementsByClassName('source')[0];
    if (!line || !content || !content.parentElement) {
      return;
    }
    const { top: lineTop } = line.getBoundingClientRect();
    const { top: contentTop } = content.getBoundingClientRect();
    const { height: boxHeight, top: boxTop } = content.parentElement.getBoundingClientRect();

    if (content) {
      content.parentElement.scrollTop = lineTop - contentTop - boxHeight / 2 + boxTop;
    }
  }
  currentLine = newCurrentLine;
}

</script>

<template>
  <div class="content code source">
    <span v-for="line in lines"
          @click="lineClicked(line)"
          :class="{
            'has-background-info': line.isCurrent,
            'has-background-danger': line.isBreakpoint
          }"
    >{{ line.content }}</span>
  </div>
</template>
