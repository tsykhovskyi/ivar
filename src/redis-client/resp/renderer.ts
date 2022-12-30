import { BulkString, RedisValue } from './types';

export class Renderer {
  render(value: RedisValue, offset = 0): string {
    if (value instanceof Error) {
      return `(error) ${value.message}`;
    }

    if (typeof value === 'number') {
      return `(integer) ${value}`;
    }

    if (value instanceof BulkString) {
      return value.toString();
    }

    if (typeof value === 'string') {
      return `"${value}"`;
    }

    if (value === null) {
      return '(nil)';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '(empty array)';
      }

      let res = '';
      const positions = this.defineArrayPositions(value);

      for (let i = 0; i < value.length; i++) {
        const nestedRes = this.render(value[i], offset + positions + 2);

        if (i > 0) {
          res += ' '.repeat(offset);
        }
        const indexStr = (i + 1).toString().padStart(positions, ' ') + ') ';
        res += indexStr + nestedRes;
        if (i < value.length - 1) {
          res += '\n';
        }
      }

      return res;
    }

    throw new Error('[resp] logic error, unable to render resi value');
  }

  private defineArrayPositions(arr: unknown[]): number {
    let positions = 0;
    let length = arr.length;
    while (length > 0) {
      length = Math.floor(length / 10);
      positions += 1;
    }

    return positions;
  }
}
