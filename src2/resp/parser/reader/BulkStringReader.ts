import { TypeReader } from './typeReader';
import { isBulkStringType } from './Reader';
import { RespValueType } from '../../utils/types';
import { MessagesBuilder } from '../queue/MessagesBuilder';

export class BulkStringReader implements TypeReader {
  tryToRead(messagesBuilder: MessagesBuilder) {
    if (messagesBuilder.isStartingWithType(isBulkStringType)) {
      const checksumLength = messagesBuilder.chunksGroup.readChecksumLength(messagesBuilder.offset + 1);
      if (checksumLength === null) {
        return;
      }
      if (checksumLength.checkSum === -1) {
        return messagesBuilder.registerSimpleMessage(RespValueType.BulkString, checksumLength.nextPosition);
      }

      const bulkMustEndsAt = checksumLength.nextPosition + checksumLength.checkSum + 2; // +2 for CRLF
      if (bulkMustEndsAt > messagesBuilder.chunksGroup.length) {
        return;
      }
      const nextLineStart = messagesBuilder.chunksGroup.findNextLineStart(bulkMustEndsAt - 2);
      if (nextLineStart !== bulkMustEndsAt) {
        throw new Error('protocol error: bulk string should end with CRLF');
      }

      return messagesBuilder.registerSimpleMessage(RespValueType.BulkString, nextLineStart);
    }
  }
}
