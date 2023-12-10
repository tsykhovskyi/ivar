import { TypeReader } from './typeReader';
import { MessagesBuilder } from '../queue/MessagesBuilder';
import { RespValueType } from '../../utils/types';

type PrimitiveType = RespValueType.SimpleString | RespValueType.Error | RespValueType.Integer;
const isPrimitiveType = (type: RespValueType): type is PrimitiveType => {
  return type === RespValueType.SimpleString
    || type === RespValueType.Error
    || type === RespValueType.Integer;
}

export class PrimitiveReader implements TypeReader {
  tryToRead(messagesBuilder: MessagesBuilder) {
    const type = messagesBuilder.isStartingWithType(isPrimitiveType);
    if (type) {
      return this.readFrom(messagesBuilder, type, messagesBuilder.offset + 1);
    }
  }

  private readFrom(messagesBuilder: MessagesBuilder, type: PrimitiveType, offset: number) {
    const nextLineStart = messagesBuilder.chunksGroup.findNextLineStart(offset);
    if (nextLineStart) {
      return messagesBuilder.registerSimpleMessage(type, nextLineStart);
    }
  }
}
