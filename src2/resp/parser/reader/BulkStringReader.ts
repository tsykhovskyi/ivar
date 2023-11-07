import { TypeReader } from './typeReader';
import {
  BulkStringChecksumDebt,
  BulkStringMessageChunkDebt,
  isBulkStringChecksumDebt,
  isBulkStringDebt,
  MessageResult,
  PendingMessage
} from './Reader';
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
      return {
        message: {
          type: type,
          chunks: [{
            buffer: chunk,
            start: offset,
            end: chunk.length,
          }],
        },
        debt: <BulkStringChecksumDebt>{
          type: type,
          incompleteCheckSum: chunk.slice(offset + 1),
          endedWithCR: isChunkEndsWithCR(chunk),
        },
      };
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
    if (!isBulkStringDebt(debt)) {
      return null
    }

    let offset = 0;
    let stringDebt: BulkStringMessageChunkDebt;
    if (isBulkStringChecksumDebt(debt)) {
      let bulkLength: number;
      if (debt.endedWithCR) {
        if (chunk[0] !== getAsciiCode('LF')) {
          throw new Error('protocol error: bulk string should end with CRLF')
        }
        bulkLength = readNumberFromBuffer(debt.incompleteCheckSum, 0, debt.incompleteCheckSum.length - 1);
        offset = 1;
      } else {
        const bulkStarts = findNextLineStart(chunk, 0);
        if (bulkStarts === null) {
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
            debt: <BulkStringChecksumDebt>{
              type: debt.type,
              incompleteCheckSum: Buffer.concat([debt.incompleteCheckSum, chunk]),
              endedWithCR: isChunkEndsWithCR(chunk),
            },
          };
        }
        const contentLengthBuf = Buffer.concat([debt.incompleteCheckSum, chunk.slice(0, bulkStarts - 2)]);
        bulkLength = readNumberFromBuffer(contentLengthBuf, 0, contentLengthBuf.length);
        offset = bulkStarts;
      }

      stringDebt = <BulkStringMessageChunkDebt>{
        type: RespValueType.BulkString,
        bytesLeft: bulkLength + 2,
        endedWithCR: false,
      }
    } else {
      stringDebt = debt;
    }

    if (chunk.length - offset < stringDebt.bytesLeft) {
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
          type: RespValueType.BulkString,
          bytesLeft: stringDebt.bytesLeft - chunk.length,
          endedWithCR: isChunkEndsWithCR(chunk),
        },
      };
    }

    let nextLineStart: number;
    if (stringDebt.bytesLeft >= 2) {
      const lineStart = findNextLineStart(chunk, offset + stringDebt.bytesLeft - 2);
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
        type: RespValueType.BulkString,
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
