import { RespValueType } from '../../utils/types';
import { TypeReader } from './typeReader';
import { PrimitiveReader } from './PrimitiveReader';
import { BulkStringReader } from './BulkStringReader';
import { ArrayReader } from './ArrayReader';

export type MessageChunkDebt = {
  type: RespValueType;
}

export type PrimitiveMessageChunkDebt = MessageChunkDebt & {
  type: RespValueType.SimpleString | RespValueType.Error | RespValueType.Integer
  endedWithCR: boolean;
}

export const isPrimitiveMessageChunkDebt = (debt: MessageChunkDebt): debt is PrimitiveMessageChunkDebt => {
  return debt.type === RespValueType.SimpleString
    || debt.type === RespValueType.Error
    || debt.type === RespValueType.Integer;
}

export type BulkStringMessageChunkDebt = MessageChunkDebt & {
  type: RespValueType.BulkString;
  bytesLeft: number;
  endedWithCR: boolean;
}

export type BulkStringChecksumDebt = MessageChunkDebt & {
  type: RespValueType.BulkString;
  incompleteCheckSum: Buffer;
  endedWithCR: boolean;
};

export const isBulkStringDebt = (debt: MessageChunkDebt): debt is BulkStringMessageChunkDebt | BulkStringChecksumDebt => {
  return debt.type === RespValueType.BulkString;
}
export const isBulkStringChecksumDebt = (debt: BulkStringMessageChunkDebt | BulkStringChecksumDebt): debt is BulkStringChecksumDebt => {
  return 'incompleteCheckSum' in debt;
}

export type ArrayMessageChunkDebt = MessageChunkDebt & {
  type: RespValueType.Array
  itemsLeft: number,
  nestedDebt: MessageChunkDebt | null,
}

export const isArrayMessageChunkDebt = (debt: MessageChunkDebt): debt is ArrayMessageChunkDebt => {
  return debt.type === RespValueType.Array;
}

export type MessageInfo = {
  type: RespValueType;
  chunks: {
    buffer: Buffer;
    start: number;
    end: number;
  }[],
}

export type FinishedMessage = {
  message: MessageInfo,
  offset: number,
}

export type PendingMessage = {
  message: MessageInfo,
  debt: MessageChunkDebt,
}

export type MessageResult = PendingMessage | FinishedMessage;

export const isFinishedMessage = (message: MessageResult): message is FinishedMessage => {
  return 'offset' in message;
}

export class Reader {
  private typeReaders: TypeReader[];

  constructor() {
    this.typeReaders = [
      new PrimitiveReader(),
      new BulkStringReader(),
      new ArrayReader(this),
    ];
  }

  readNewMessage(chunk: Buffer, offset: number): MessageResult {
    for (const reader of this.typeReaders) {
      const message = reader.readNewMessage(chunk, offset);
      if (message) {
        return message;
      }
    }

    throw new Error(`protocol error: unknown message type ${chunk[offset]}`);
  }

  readMessageWithDebt(chunk: Buffer, pendingMessage: PendingMessage): MessageResult {
    for (const reader of this.typeReaders) {
      const message = reader.readMessageWithDebt(chunk, pendingMessage);
      if (message) {
        return message;
      }
    }

    throw new Error('protocol error: unable to proceed with unfinished message');
  }
}
