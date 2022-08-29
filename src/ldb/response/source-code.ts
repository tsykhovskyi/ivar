import { removeConsoleStyles } from "./common";
import { Line } from "../connection-interface";

export function processSourceCode(content: string): Line[] {
  content = removeConsoleStyles(content);

  const lineNumberRegexp = /\s*(->)?\s*(#)?\s*(\d+)/;
  const rawLines = content.split('\n');

  const lines: Line[] = [];
  for (const rawLine of rawLines) {
    const match = rawLine.match(lineNumberRegexp);
    if (match === null) {
      continue;
    }
    lines.push({
      content: rawLine,
      number: +match[3],
      isBreakpoint: match[2] != undefined,
      isCurrent: match[1] != undefined,
    });
  }
  return lines;
}