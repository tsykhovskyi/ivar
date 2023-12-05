import { Duplex } from 'stream';
import { RequestsStream } from './RequestsStream';
import { PassThroughDuplex } from './PassThroughDuplex';
import * as Buffer from 'buffer';
import { MessagesGroupExtractor } from '../resp/parser/MessagesGroupExtractor';

export class ProxyLogger extends PassThroughDuplex {
  // public readonly requests: RequestsStream;
  private requestExtractor: MessagesGroupExtractor;

  constructor(origin: Duplex) {
    super(origin);
    this.requestExtractor = new MessagesGroupExtractor();
  }

  protected override onRead(chunk: Buffer) {
    console.log('[READ]: ' + chunk.toString().substring(0, 16));
    const request = this.requestExtractor.add(chunk);
    if (request) {
      console.log('==================== REQUEST ====================');
      console.log(request.messages.map(v1 => v1.type + ' ' + v1.start+ ':' + v1.end).join('\n'));
      console.log('==================== /REQUEST ====================');
    }
  }

  protected override onWrite(chunk: Buffer, encoding: BufferEncoding) {
    console.log('[WRITE]: ' + chunk.toString().substring(0, 16));
    // this.requests.newRequest(chunk.toString());
  }
}
