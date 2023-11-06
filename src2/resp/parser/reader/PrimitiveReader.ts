import { isPrimitiveMessageChunkDebt, MessageResult, PendingMessage, PrimitiveMessageChunkDebt } from './Reader';
import { defineRespType, findNextLineStart, isChunkEndsWithCR } from '../BufferUtils';
import { RespValueType } from '../../utils/types';
import { TypeReader } from './typeReader';
import Buffer from 'buffer';
import { getAsciiCode } from '../../utils/ascii';

export class PrimitiveReader implements TypeReader {
  public readNewMessage(chunk: Buffer, offset: number): MessageResult | null {
    const type = defineRespType(chunk[offset]);
    if (
      type !== RespValueType.SimpleString
      && type !== RespValueType.Error
      && type !== RespValueType.Integer
    ) {
      return null;
    }

    const nextLineStart = findNextLineStart(chunk, offset);
    if (nextLineStart === null) {
      return {
        message: {
          type: type,
          chunks: [{
            buffer: chunk,
            start: offset,
            end: chunk.length,
          }],
        },
        debt: <PrimitiveMessageChunkDebt>{
          type: type,
          endedWithCR: isChunkEndsWithCR(chunk),
        },
      };
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

  public readMessageWithDebt(chunk: Buffer, { message, debt }: PendingMessage): MessageResult | null {
    if (!isPrimitiveMessageChunkDebt(debt)) {
      return null
    }

    let nextLineStart: number | null;
    if (debt.endedWithCR && chunk[0] !== getAsciiCode('LF')) {
      nextLineStart = 1;
    } else {
      nextLineStart = findNextLineStart(chunk, 0);
    }
    if (nextLineStart === null) {
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
        debt: debt,
      };
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
