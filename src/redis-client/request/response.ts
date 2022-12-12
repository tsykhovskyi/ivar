import EventEmitter from 'events';
import { PayloadExtractor, RedisValue, RESPConverter } from '../resp';

export declare interface Response {
  on(eventName: 'data', listener: (chunk: string) => void): this;
  once(eventName: 'data', listener: (chunk: string) => void): this;

  on(
    eventName: 'message',
    listener: (response: RedisValue, raw: string) => void
  ): this;
  once(
    eventName: 'message',
    listener: (response: RedisValue, raw: string) => void
  ): this;

  once(eventName: 'end', listener: () => void): this;
}

export class Response extends EventEmitter {
  private payload: PayloadExtractor;
  private messageIsExpected = false;

  constructor() {
    super();
    this.payload = new PayloadExtractor('');
  }

  chunkReceived(chunk: string) {
    this.emit('data', chunk);

    this.payload.append(chunk);

    try {
      while (!this.payload.isCompleted()) {
        const message = RESPConverter.extract(this.payload);
        const rawMessage = this.payload.processedPayload();
        this.payload = new PayloadExtractor(this.payload.unprocessedPayload());
        this.messageIsExpected = false;
        this.emit('message', message, rawMessage);
      }
      if (!this.messageIsExpected) {
        this.emit('end');
      }
    } catch (err) {
      console.log(
        `[redis response] unable to parse payload. Length - ${
          this.payload.unprocessedPayload().length
        } bytes`
      );
    }
  }

  expectMessage() {
    this.messageIsExpected = true;
  }

  message(): Promise<[RedisValue, string]> {
    return new Promise((resolve) => {
      this.on('message', (value, raw) => {
        resolve([value, raw]);
      });
    });
  }

  destroy() {
    this.removeAllListeners();
  }
}
