import { isPrimitiveMessageChunkDebt, isPrimitiveType, PrimitiveMessageChunkDebt } from './Reader';
import { TypeReader } from './typeReader';
import { MessagesBuilder } from '../queue/MessagesBuilder';

export class PrimitiveReader implements TypeReader {
  tryToRead(messagesBuilder: MessagesBuilder) {
    const type = messagesBuilder.isStartingWithType(isPrimitiveType);
    if (type) {
      const nextLineStart = messagesBuilder.chunksGroup.findNextLineStart(messagesBuilder.offset);
      if (nextLineStart === null) {
        return messagesBuilder.registerDebt(<PrimitiveMessageChunkDebt>{ type });
      }

      return messagesBuilder.registerSimpleMessage(type, nextLineStart);
    }

    const debt = messagesBuilder.popDebtIf(isPrimitiveMessageChunkDebt);
    if (debt) {
      const nextLineStart = messagesBuilder.chunksGroup.findNextLineStart(messagesBuilder.offset - 1);
      if (nextLineStart) {
        return messagesBuilder.registerSimpleMessage(debt.type, nextLineStart);
      }

      return messagesBuilder.registerDebt(<PrimitiveMessageChunkDebt>{
        type: debt.type,
      });
    }
  }
}
