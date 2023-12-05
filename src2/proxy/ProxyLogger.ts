import { Duplex } from 'stream';
import { RequestsStream } from './RequestsStream';
import { PassThroughDuplex } from './PassThroughDuplex';
import * as Buffer from 'buffer';
import { MessagesGroupExtractor } from '../resp/parser/MessagesGroupExtractor';
import { logMessage } from '../resp/utils/logger';

export class ProxyLogger extends PassThroughDuplex {
  private requestExtractor: MessagesGroupExtractor;
  private responseExtractor: MessagesGroupExtractor;

  constructor(origin: Duplex) {
    super(origin);
    this.requestExtractor = new MessagesGroupExtractor();
    this.responseExtractor = new MessagesGroupExtractor();
  }

  protected override onRead(chunk: Buffer) {
    this.logChunk('READ', chunk);
    const request = this.responseExtractor.add(chunk);
    if (request) {
      logMessage('Response', request);
    }
  }

  protected override onWrite(chunk: Buffer, encoding: BufferEncoding) {
    this.logChunk('WRITE', chunk);
    const request = this.requestExtractor.add(chunk);
    if (request) {
      logMessage('Request', request);
    }
  }

  protected logChunk(type: 'READ' | 'WRITE', chunk: Buffer) {
    console.log(`[${type} ${chunk.length} bytes]: ` + chunk.toString().substring(0, 64).replaceAll('\r\n', '\\r\\n'));
  }
}
