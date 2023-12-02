import { RespValueType } from '../../utils/types';
import { TypeReader } from './typeReader';
import { PrimitiveReader } from './PrimitiveReader';
import { BulkStringReader } from './BulkStringReader';
import { ArrayReader } from './ArrayReader';
import { MessagesBuilder } from '../queue/MessagesBuilder';

export type PrimitiveType = RespValueType.SimpleString | RespValueType.Error | RespValueType.Integer;

export const isPrimitiveType = (type: RespValueType): type is PrimitiveType => {
  return type === RespValueType.SimpleString
    || type === RespValueType.Error
    || type === RespValueType.Integer;
}

export const isBulkStringType = (type: RespValueType): type is RespValueType.Array => {
  return type === RespValueType.BulkString;
}

export const isArrayType = (type: RespValueType): type is RespValueType.Array => {
  return type === RespValueType.Array;
}

export class Reader {
  private typeReaders: TypeReader[];

  constructor() {
    this.typeReaders = [
      new PrimitiveReader(),
      new BulkStringReader(),
      new ArrayReader(),
    ];
  }

  consume(messagesBuilder: MessagesBuilder): void {
    for (;;) {
      const startedAt = messagesBuilder.offset;
      for (const reader of this.typeReaders) {
        reader.tryToRead(messagesBuilder);
      }
      if (messagesBuilder.offset === startedAt) {
        break;
      }
    }
  }
}
