import { removeConsoleStyles } from "./common";

export interface Variable {
  name: string;
  value: string;
}
export function processVariables(content: string): Variable[] {
  content = removeConsoleStyles(content);
  const lines = content.split('\n');

  const vars: Variable[] = [];
  for(const line of lines) {
    const match = line.match(/^<value>\s*(\w+)\s*=\s*(.+)$/);
    if (match === null) {
      continue;
    }
    const name = match[1];
    const value = match[2];

    vars.push({
      name,
      value,
    })
  }

  return vars;
}
