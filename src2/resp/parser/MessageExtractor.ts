import { isFinishedMessage, MessageInfo, MessageResult, PendingMessage, Reader } from './reader/Reader';

export class MessageExtractor {
  offset = 0;

  chunks: Buffer[] = [];

  messages: MessageInfo[] = [];
  pendingMessage: PendingMessage | null = null;

  private reader: Reader;

  constructor() {
    this.reader = new Reader()
  }

  get isComplete(): boolean {
    return this.pendingMessage === null;
  }

  private get currentChunk(): Buffer {
    const chunk = this.chunks[this.chunks.length - 1];
    if (!chunk) {
      throw new Error('no chunk');
    }
    return chunk;
  }

  add(chunk: Buffer) {
    this.chunks.push(chunk);
    this.offset = 0;

    this.read();
  }

  clearMessages() {
    this.messages = [];
  }

  private read() {
    while (this.offset < this.currentChunk.length) {
      let result: MessageResult;
      if (this.pendingMessage) {
        result = this.reader.readMessageWithDebt(this.currentChunk, this.pendingMessage);
      } else {
        result = this.reader.readNewMessage(this.currentChunk, this.offset);
      }

      if (isFinishedMessage(result)) {
        this.pendingMessage = null;
        this.messages.push(result.message);
        this.offset = result.offset;
      } else {
        this.pendingMessage = result;
        this.offset = this.currentChunk.length;
      }
    }
  }
}
