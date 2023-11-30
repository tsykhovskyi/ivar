import { TypeReader } from './typeReader';
import { BulkStringMessageChunkDebt, isBulkStringDebt, isBulkStringType, isPrimitiveType } from './Reader';
import { defineRespType } from '../BufferUtils';
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

    const debt = messagesBuilder.popDebtIf(isBulkStringDebt);
    if (debt) {
      return this.readMessage(messagesBuilder, 0, debt.bytesLeft);
    }
  }

  private readMessage(messagesBuilder: MessagesBuilder, bulkStartOffset: number, bytesLeft: number) {
    if (messagesBuilder.chunksGroup.length - bulkStartOffset < bytesLeft) {
      return messagesBuilder.registerDebt(<BulkStringMessageChunkDebt>{
        type: RespValueType.BulkString,
        bytesLeft: bytesLeft - (messagesBuilder.chunksGroup.length - messagesBuilder.offset),
      });
    }

    // ensure newline
    const nextLineStart = messagesBuilder.chunksGroup.findNextLineStart(bulkStartOffset + bytesLeft - 2);
    if (nextLineStart !== bulkStartOffset + bytesLeft) {
      throw new Error('protocol error: bulk string should end with CRLF');
    }

    return messagesBuilder.registerSimpleMessage(RespValueType.BulkString, nextLineStart);
  }
}
