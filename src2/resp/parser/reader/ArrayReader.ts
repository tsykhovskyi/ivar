import { TypeReader } from './typeReader';
import { isArrayType } from './Reader';
import { RespValueType } from '../../utils/types';
import { MessagesBuilder } from '../queue/MessagesBuilder';

export class ArrayReader implements TypeReader {
  tryToRead(messagesBuilder: MessagesBuilder) {
    if (messagesBuilder.isStartingWithType(isArrayType)) {
      const checksumLength = messagesBuilder.chunksGroup.readChecksumLength(messagesBuilder.offset + 1);
      if (checksumLength === null) {
        return;
      }

      return messagesBuilder.registerCollectionMessage(RespValueType.Array, checksumLength.nextPosition, checksumLength.checkSum);
    }
  }
}
