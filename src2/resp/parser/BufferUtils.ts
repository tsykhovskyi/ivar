import { RespValueType } from '../utils/types';
import { getAsciiCode } from '../utils/ascii';

export const findNextLineStart = (chunk: Buffer, from: number): number | null => {
  const position = chunk.indexOf(getAsciiCode('LF'), from);
  if (position < 1) {
    return null;
  }
  if (chunk[position - 1] !== getAsciiCode('CR')) {
    throw new Error('CRLF sequence is mandatory');
  }
  return position + 1;
}

export const isChunkEndsWithCR = (chunk: Buffer): boolean => {
  return chunk[chunk.length - 1] === getAsciiCode('CR');
}

export const readNumberFromBuffer = (buffer: Buffer, start: number, end: number): number => {
  let result = 0;
  for (let i = start; i < end; i++) {
    const char = buffer[i];
    if (char === undefined || char < getAsciiCode('0') || char > getAsciiCode('9')) {
      throw new Error(`Invalid number ${buffer.toString('utf8', start, end)}`);
    }
    result = result * 10 + char - getAsciiCode('0');
  }
  return result;
}

export const defineRespType = (symbol?: number): RespValueType | undefined => {
  switch (symbol) {
    case getAsciiCode('+'): return RespValueType.SimpleString;
    case getAsciiCode('-'): return RespValueType.Error;
    case getAsciiCode(':'): return RespValueType.Integer;
    case getAsciiCode('$'): return RespValueType.BulkString;
    case getAsciiCode('*'): return RespValueType.Array;
  }
  return undefined;
}
