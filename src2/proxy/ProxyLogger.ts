import { Duplex } from 'stream';
import { RequestsStream } from './RequestsStream';
import { PassThroughDuplex } from './PassThroughDuplex';
import * as Buffer from 'buffer';
import { MessageExtractor } from '../resp/parser/MessageExtractor';

export class ProxyLogger extends PassThroughDuplex {
  public readonly requests: RequestsStream;
  private requestExtractor: MessageExtractor;

  constructor(origin: Duplex) {
    super(origin);

    this.requests = new RequestsStream();

    this.requestExtractor = new MessageExtractor();
  }

  protected override onRead(chunk: Buffer) {
    console.log('[READ]: ' + chunk.toString().substring(0, 16));
    this.requestExtractor.add(chunk);
    if (this.requestExtractor.isComplete) {
      console.log(JSON.stringify(this.requestExtractor.messages.map(i => ({ ...i, chunks: i.chunks.map(c => [c.start, c.end]) })), null, 2))
      this.requestExtractor.clearMessages();
    // } else {
    //   console.log(JSON.stringify(this.requestExtractor.pendingMessage?.debt, null, 2));
    }
  }

  protected override onWrite(chunk: Buffer, encoding: BufferEncoding) {
    console.log('[WRITE]: ' + chunk.toString().substring(0, 16));
    // this.requests.newRequest(chunk.toString());
  }
}
