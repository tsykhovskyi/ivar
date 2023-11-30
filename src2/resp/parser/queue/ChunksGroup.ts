import { getAsciiCode } from '../../utils/ascii';
import Buffer from 'buffer';

export type ChunkId = number;

export class ChunksGroup {
  chunks: Buffer[] = [];

  add(chunk: Buffer) {
    this.chunks.push(chunk);
  }

  get length(): number {
    return this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  }

  private chunkById(i: number): Buffer {
    const chunk = this.chunks[i];
    if (!chunk) {
      throw new Error(`Logic error: chunk ${i} is not found`);
    }
    return chunk;
  }

  private chunkIdWithOffsetByGlobalOffset(globalOffset: number): [number, number] | null {
    for (let i = 0; i < this.chunks.length; i += 1) {
      const chunkSize = this.chunkById(i).length;
      if (globalOffset < chunkSize) {
        return [i, globalOffset];
      }
      globalOffset -= chunkSize;
    }
    return null;
  }

  indexOf(value: number, offset: number) {
    let position = -1;
    const location = this.chunkIdWithOffsetByGlobalOffset(offset);
    if (!location) {
      return position;
    }
    let [chunkIndex, chunkOffset] = location;

    while (position === -1 && chunkIndex < this.chunks.length) {
      position = this.chunkById(chunkIndex).indexOf(value, chunkOffset);
      chunkIndex += 1;
      chunkOffset = 0;
    }
    return position;
  }

  at(offset: number): number | undefined {
    const location = this.chunkIdWithOffsetByGlobalOffset(offset);
    if (location) {
      const [chunkIndex, chunkOffset] = location;
      return this.chunkById(chunkIndex)[chunkOffset];
    }
    return undefined;
  }

  findNextLineStart(from: number): number | null {
    while (from !== -1) {
      from = this.indexOf(getAsciiCode('LF'), from);
      if (from !== -1 && this.at(from - 1) === getAsciiCode('CR')) {
        return from + 1;
      }
    }

    return null;
  }

  readChecksumLength(from: number): { nextPosition: number, checkSum: number } | null {
    let negative = false;
    let result = 0;

    let char = this.at(from);
    while (char !== undefined) {
      if (char === getAsciiCode('-')) {
        if (negative) {
          throw new Error(`Invalid number: 2 negative signs in a row: ${from}  }`);
        }
        negative = true;
      } else if (char >= getAsciiCode('0') && char <= getAsciiCode('9')) {
        result = result * 10 + char - getAsciiCode('0');
      } else if (char === getAsciiCode('CR')) {
        const nextChar = this.at(from + 1);
        if (nextChar === getAsciiCode('LF')) {
          return { nextPosition: from + 2, checkSum: negative ? -result : result };
        }
        if (nextChar === undefined) {
          return null;
        }
        throw new Error(`Invalid number: ${from}`);
      } else {
        throw new Error(`Invalid number: ${from}`);
      }

      from += 1;
      char = this.at(from);
    }
    return null;
  }
}
