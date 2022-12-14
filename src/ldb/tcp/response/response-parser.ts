import { RedisValue } from '../../../redis-client/resp';
import { Line, Variable } from '../../lua-debugger-interface';
import { isString } from '../../../redis-client/resp/types';

const positionsCnt = (v: number): number => Math.floor(Math.log10(v)) + 1;

export class ResponseParser {
  toSourceCode(value: RedisValue): Line[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const lines: Line[] = [];
    for (const rawLine of value) {
      if (!isString(rawLine)) {
        return [];
      }

      const matches = rawLine.match(/^(->)?\s*(#?)(\d+)(\s+.*)$/);
      if (matches === null) {
        return [];
      }

      const lineNumber = parseInt(matches[3] as string);
      const linePositions = positionsCnt(lineNumber);

      lines.push(<Line>{
        isCurrent: !!matches[1],
        isBreakpoint: !!matches[2],
        number: lineNumber,
        content: (matches[4] as string).slice(4 - linePositions),
      });
    }

    return lines;
  }

  toVariables(value: RedisValue): Variable[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const variables: Variable[] = [];
    for (const rawLine of value) {
      if (!isString(rawLine)) {
        return [];
      }

      const matches = rawLine.match(/^<value>\s+(.+)\s+=\s+(.+)$/);
      if (matches === null) {
        return [];
      }

      variables.push({
        name: matches[1] as string,
        value: matches[2] as string,
      });
    }

    return variables;
  }

  toSingleVariable(value: RedisValue): string | null {
    if (!Array.isArray(value) || value.length !== 1) {
      return null;
    }
    const rawLine = value[0];
    if (!isString(rawLine)) {
      return null;
    }

    const matches = rawLine.match(/^<value>\s+(.+)$/);
    if (matches === null) {
      return null;
    }

    return matches[1] as string;
  }

  toStrings(value: RedisValue): string[] {
    if (Array.isArray(value)) {
      return value.map((record) => (record !== null ? record.toString() : ''));
    }

    return value === null ? [] : [value.toString()];
  }
}
