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

      return this.readMessage(messagesBuilder, checksumLength.nextPosition, checksumLength.checkSum + 2); // +2 for CRLF
    }
  }

  private readMessage(messagesBuilder: MessagesBuilder, bulkStartOffset: number, bytesLeft: number) {
    if (bulkStartOffset + bytesLeft > messagesBuilder.chunksGroup.length) {
      return;
    }

    // ensure newline
    const nextLineStart = messagesBuilder.chunksGroup.findNextLineStart(bulkStartOffset + bytesLeft - 2);
    if (nextLineStart !== bulkStartOffset + bytesLeft) {
      throw new Error('protocol error: bulk string should end with CRLF');
    }

    return messagesBuilder.registerSimpleMessage(RespValueType.BulkString, nextLineStart);
  }
}
