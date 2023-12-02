import { Reader } from './reader/Reader';
import { ChunksGroup } from './queue/ChunksGroup';
import { MessagesBuilder, MessagesMiningResult } from './queue/MessagesBuilder';

export class MessageExtractor {
  chunks: ChunksGroup = new ChunksGroup();
  builder: MessagesBuilder = new MessagesBuilder();

  messages: MessagesMiningResult[] = [];

  private reader: Reader;

  constructor() {
    this.reader = new Reader()
  }

  get isComplete(): boolean {
    return this.builder.isCompleted;
  }

  add(chunk: Buffer) {
    this.builder.add(chunk);
    this.read();
  }

  clearMessages() {
    this.messages = [];
  }

  private read() {
    this.reader.consume(this.builder)
    if (this.builder.isCompleted) {
      this.messages.push(this.builder.result);
      this.builder = new MessagesBuilder();
    }
  }
}
