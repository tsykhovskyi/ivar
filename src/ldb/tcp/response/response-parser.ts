import { RedisValue } from "../../../redis-client/resp-coder";
import { Line, Variable } from "../../lua-debugger-interface";

const positionsCnt = (v: number): number => Math.floor(Math.log10(v)) + 1;

export class ResponseParser {
  toSourceCode(value: RedisValue): Line[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const lines: Line[] = [];
    for (const rawLine of value) {
      if (typeof rawLine !== 'string') {
        return [];
      }

      const matches = rawLine.match(/^(->)?\s*(#?)(\d+)(\s+.*)$/);
      if (matches === null) {
        return [];
      }

      const lineNumber = parseInt(matches[3]);
      const linePositions = positionsCnt(lineNumber);

      lines.push(<Line>{
        isCurrent: !!matches[1],
        isBreakpoint: !!matches[2],
        number: lineNumber,
        content: matches[4].slice(4 - linePositions),
      })
    }

    return lines;
  }

  toVariables(value: RedisValue): Variable[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const variables: Variable[] = [];
    for (const rawLine of value) {
      if (typeof rawLine !== 'string') {
        return [];
      }

      const matches = rawLine.match(/^<value>\s+(.+)\s+=\s+(.+)$/);
      if (matches === null) {
        return [];
      }

      variables.push({
        name: matches[1],
        value: matches[2],
      });
    }

    return variables;
  }

  toString(value: RedisValue): string {
    return JSON.stringify(value);
  }
}
