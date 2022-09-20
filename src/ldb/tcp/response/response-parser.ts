import { RedisValue } from "../../../redis-client/resp-coder";
import { Line, Variable } from "../../lua-debugger-interface";

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

      const matches = rawLine.match(/^(->)?\s+(#?)(\d+)\s+(.*)$/);
      if (matches === null) {
        return [];
      }

      lines.push(<Line>{
        isCurrent: !!matches[1],
        isBreakpoint: !!matches[2],
        number: parseInt(matches[3]),
        content: matches[4],
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
