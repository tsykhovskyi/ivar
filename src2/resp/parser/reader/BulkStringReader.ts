import { TypeReader } from './typeReader';
import * as Buffer from 'buffer';
import { BulkStringMessageChunkDebt, isBulkStringMessageChunkDebt, MessageResult, PendingMessage } from './Reader';
import { defineRespType, findNextLineStart, isChunkEndsWithCR, readNumberFromBuffer } from '../BufferUtils';
import { RespValueType } from '../../utils/types';
import { getAsciiCode } from '../../utils/ascii';

export class BulkStringReader implements TypeReader {
  readNewMessage(chunk: Buffer, offset: number): MessageResult | null {
    const type = defineRespType(chunk[offset]);
    if (type !== RespValueType.BulkString) {
      return null;
    }

    const bulkStarts = findNextLineStart(chunk, offset);
    if (bulkStarts === null) {
      throw new Error('protocol error: bulk string length is not specified');
    }
    const bulkLength = readNumberFromBuffer(chunk, offset + 1, bulkStarts - 2);
    if (chunk.length - 2 - bulkStarts < bulkLength) {
      return {
        message: {
          type: type,
          chunks: [{
            buffer: chunk,
            start: offset,
            end: chunk.length,
          }],
        },
        debt: <BulkStringMessageChunkDebt>{
          type: type,
          bytesLeft: bulkLength - (chunk.length - 2 - bulkStarts),
          endedWithCR: isChunkEndsWithCR(chunk),
        },
      };
    }

    const nextLineStart = findNextLineStart(chunk, bulkStarts + bulkLength);
    if (nextLineStart === null) {
      throw new Error('protocol error: bulk string is not terminated');
    }
    return {
      offset: nextLineStart,
      message: {
        type: type,
        chunks: [{
          buffer: chunk,
          start: offset,
          end: nextLineStart,
        }],
      },
    };
  }

  readMessageWithDebt(chunk: Buffer, { message, debt }: PendingMessage): MessageResult | null {
    if (!isBulkStringMessageChunkDebt(debt)) {
      return null
    }

    if (chunk.length < debt.bytesLeft) {
      return {
        message: {
          type: debt.type,
          chunks: [
            ...message.chunks,
            {
              buffer: chunk,
              start: 0,
              end: chunk.length,
            }
          ],
        },
        debt: <BulkStringMessageChunkDebt>{
          type: debt.type,
          bytesLeft: debt.bytesLeft - chunk.length,
          endedWithCR: isChunkEndsWithCR(chunk),
        },
      };
    }

    let nextLineStart: number;
    if (debt.bytesLeft >= 2) {
      const lineStart = findNextLineStart(chunk, debt.bytesLeft - 2);
      if (lineStart === null) {
        throw new Error('protocol error: bulk string should end with CRLF');
      }
      nextLineStart = lineStart;
    } else if(debt.endedWithCR && chunk[0] === getAsciiCode('LF')) {
      nextLineStart = 1;
    } else {
      throw new Error('protocol error: bulk string should end with CRLF');
    }
    return {
      offset: nextLineStart,
      message: {
        type: debt.type,
        chunks: [
          ...message.chunks,
          {
            buffer: chunk,
            start: 0,
            end: nextLineStart,
          }
        ],
      },
    };
  }
}
