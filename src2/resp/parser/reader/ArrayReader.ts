import { TypeReader } from './typeReader';
import Buffer from 'buffer';
import {
  ArrayMessageChunkDebt,
  isArrayMessageChunkDebt,
  isFinishedMessage,
  MessageResult,
  PendingMessage,
  Reader
} from './Reader';
import { defineRespType, findNextLineStart, readNumberFromBuffer } from '../BufferUtils';
import { RespValueType } from '../../utils/types';

export class ArrayReader implements TypeReader {
  constructor(private commonReader: Reader) {
  }

  readNewMessage(chunk: Buffer, offset: number): MessageResult | null {
    const type = defineRespType(chunk[offset]);
    if (type !== RespValueType.Array) {
      return null;
    }

    const nextLineStart = findNextLineStart(chunk, offset);
    if (nextLineStart === null) {
      throw new Error('protocol error: array length is not specified');
    }
    const arraySize = readNumberFromBuffer(chunk, offset + 1, nextLineStart - 2);

    return this.readItems(chunk, arraySize, offset, nextLineStart);
  }

  readMessageWithDebt(chunk: Buffer, { message, debt }: PendingMessage): MessageResult | null {
    if (!isArrayMessageChunkDebt(debt)) {
      return null;
    }

    let itemOffset = 0;
    let itemsLeft = debt.itemsLeft;
    if (debt.nestedDebt) {
      const itemMessage = this.commonReader.readMessageWithDebt(
        chunk,
        {
          debt: debt.nestedDebt,
          message: { type: debt.nestedDebt.type, chunks: [] }
        }
      );
      if (!isFinishedMessage(itemMessage)) {
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
          debt: <ArrayMessageChunkDebt>{
            type: debt.type,
            itemsLeft: debt.itemsLeft,
            nestedDebt: itemMessage.debt,
          },
        };
      }
      itemOffset += itemMessage.offset;
      itemsLeft -= 1;
    }

    const itemsResult =  this.readItems(chunk, itemsLeft,0,  itemOffset);
    return {
      ...itemsResult,
      message: {
        type: debt.type,
        chunks: [
          ...message.chunks,
          ...itemsResult.message.chunks,
        ],
      },
    }
  }

  private readItems(chunk: Buffer, arraySize: number, offset: number, itemOffset: number): MessageResult {
    for (let i = 0; i < arraySize; i += 1) {
      if (itemOffset > chunk.length) {
        throw new Error('protocol error: offset exceeds chunk length');
      }
      if (itemOffset === chunk.length) {
        return {
          message: {
            type: RespValueType.Array,
            chunks: [{
              buffer: chunk,
              start: offset,
              end: chunk.length,
            }],
          },
          debt: <ArrayMessageChunkDebt>{
            type: RespValueType.Array,
            itemsLeft: arraySize - i,
            nestedDebt: null,
          },
        };
      }
      const itemMessage = this.commonReader.readNewMessage(chunk, itemOffset);
      if (!isFinishedMessage(itemMessage)) {
        return {
          message: {
            type: RespValueType.Array,
            chunks: [{
              buffer: chunk,
              start: offset,
              end: chunk.length,
            }],
          },
          debt: <ArrayMessageChunkDebt>{
            type: RespValueType.Array,
            itemsLeft: arraySize - i,
            nestedDebt: itemMessage.debt,
          },
        };
      }
      itemOffset = itemMessage.offset;
    }
    return {
      offset: itemOffset,
      message: {
        type: RespValueType.Array,
        chunks: [{
          buffer: chunk,
          start: offset,
          end: itemOffset,
        }],
      },
    };
  }
}
