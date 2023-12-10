import { Reader } from './reader/Reader';
import { MessageInfo, MessagesBuilder, PipeBuildResult } from './queue/MessagesBuilder';

export type PipeContour = {
  messages: MessageInfo[],
  chunks: Buffer[],
}

export class MessagesGroupExtractor {
  builder = new MessagesBuilder();

  private reader: Reader;

  constructor() {
    this.reader = new Reader();
  }

  add(chunk: Buffer): PipeContour | null {
    this.builder.add(chunk);
    this.reader.consume(this.builder)
    const result = this.builder.result;
    if (result.isCompleted) {
      this.builder = new MessagesBuilder();
      return {
        messages: result.messages,
        chunks: result.chunks,
      };
    }
    return null;
  }

}
