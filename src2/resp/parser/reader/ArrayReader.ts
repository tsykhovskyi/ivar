import { TypeReader } from './typeReader';
import { isArrayMessageChunkDebt, isArrayType, Reader } from './Reader';
import { RespValueType } from '../../utils/types';
import { MessagesBuilder } from '../queue/MessagesBuilder';

export class ArrayReader implements TypeReader {
  constructor(private commonReader: Reader) {
  }

  tryToRead(messagesBuilder: MessagesBuilder) {
    if (messagesBuilder.isStartingWithType(isArrayType)) {
      const checksumLength = messagesBuilder.chunksGroup.readChecksumLength(messagesBuilder.offset + 1);
      if (checksumLength === null) {
        return;
      }

      messagesBuilder.registerCollectionMessage(RespValueType.Array, checksumLength.nextPosition, checksumLength.checkSum)

      return this.readItems(messagesBuilder, checksumLength.checkSum);
    }

    const debt = messagesBuilder.popDebtIf(isArrayMessageChunkDebt);
    if (debt) {
      return this.readItems(messagesBuilder, debt.itemsLeft);
    }
  }

  private readItems(queue: MessagesBuilder, itemsLeft: number): void {
    for (let i = 0; i < itemsLeft; i += 1) {
      const shifted = this.commonReader.tryToRead(queue);
      if (!shifted) {
        return;
      }
    }
  }
}
