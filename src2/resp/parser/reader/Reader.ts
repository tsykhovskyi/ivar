import { RespValueType } from '../../utils/types';
import { TypeReader } from './typeReader';
import { PrimitiveReader } from './PrimitiveReader';
import { BulkStringReader } from './BulkStringReader';
import { ArrayReader } from './ArrayReader';
import { MessagesBuilder } from '../queue/MessagesBuilder';

export type MessageChunkDebt = {
  type: RespValueType;
}

export type PrimitiveType = RespValueType.SimpleString | RespValueType.Error | RespValueType.Integer;

export type PrimitiveMessageChunkDebt = MessageChunkDebt & {
  type: PrimitiveType;
}

export const isPrimitiveType = (type: RespValueType): type is PrimitiveType => {
  return type === RespValueType.SimpleString
    || type === RespValueType.Error
    || type === RespValueType.Integer;
}

export const isPrimitiveMessageChunkDebt = (debt: MessageChunkDebt): debt is PrimitiveMessageChunkDebt => isPrimitiveType(debt.type);

export type BulkStringMessageChunkDebt = MessageChunkDebt & {
  type: RespValueType.BulkString;
  bytesLeft: number;
}

export const isBulkStringType = (type: RespValueType): type is RespValueType.Array => {
  return type === RespValueType.BulkString;
}

export const isBulkStringDebt = (debt: MessageChunkDebt): debt is BulkStringMessageChunkDebt => isBulkStringType(debt.type);

export type ArrayMessageChunkDebt = MessageChunkDebt & {
  type: RespValueType.Array
  itemsLeft: number,
}

export const isArrayType = (type: RespValueType): type is RespValueType.Array => {
  return type === RespValueType.Array;
}

export const isArrayMessageChunkDebt = (debt: MessageChunkDebt): debt is ArrayMessageChunkDebt => isArrayType(debt.type);

// export type MessageInfo = {
//   type: RespValueType;
//   chunks: {
//     buffer: Buffer;
//     start: number;
//     end: number;
//   }[],
// }
//
// export type FinishedMessage = {
//   message: MessageInfo,
//   offset: number,
// }
//
// export type PendingMessage = {
//   message: MessageInfo,
//   debt: MessageChunkDebt,
// }

// export type MessageResult = PendingMessage | FinishedMessage;
//
// export const isFinishedMessage = (message: MessageResult): message is FinishedMessage => {
//   return 'offset' in message;
// }

export class Reader {
  private typeReaders: TypeReader[];

  constructor() {
    this.typeReaders = [
      new PrimitiveReader(),
      new BulkStringReader(),
      new ArrayReader(this),
    ];
  }

  tryToRead(messagesBuilder: MessagesBuilder): boolean {
    const startedAt = messagesBuilder.offset;
    for (const reader of this.typeReaders) {
      reader.tryToRead(messagesBuilder);
    }
    return messagesBuilder.offset > startedAt;
  }
}
