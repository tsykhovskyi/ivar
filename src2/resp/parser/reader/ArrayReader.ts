import { TypeReader } from './typeReader';
import { RespValueType } from '../../utils/types';
import { MessagesBuilder } from '../queue/MessagesBuilder';

const isArrayType = (type: RespValueType): type is RespValueType.Array => {
  return type === RespValueType.Array;
}

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
