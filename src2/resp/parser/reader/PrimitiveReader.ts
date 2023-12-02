import { isPrimitiveType, PrimitiveType } from './Reader';
import { TypeReader } from './typeReader';
import { MessagesBuilder } from '../queue/MessagesBuilder';

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
