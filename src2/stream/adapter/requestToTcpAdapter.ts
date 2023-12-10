import { Duplex } from 'stream';
import { Pipe } from '../pipe';
import { MessagesGroupExtractor } from '../../resp/parser/MessagesGroupExtractor';

export class RequestToTcpAdapter extends Duplex {
  private response: Pipe | null = null;
  private extractor = new MessagesGroupExtractor();

  constructor(private $tcp: Duplex) {
    super({
      objectMode: true,
    });

    this.$tcp.pause();

    this.$tcp.on('data', (chunk: Buffer) => {
      if (this.response === null) {
        this.response = new Pipe();
        this.push(this.response);
      }

      this.response.push(chunk);

      const pipeContour = this.extractor.add(chunk); // todo check messages count
      if (pipeContour) {
        this.response.__complete(pipeContour);
        this.response = null;
        this.$tcp.pause(); // until new request is transferred
      }
    });
  }

  override _read(size: number) {
    this.$tcp.read(size);
  }

  override _write(request: Pipe, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    request.on('data', (chunk: Buffer) => {
      this.$tcp.write(chunk, 'ascii', callback);
    });
    request.on('end', () => {
      this.$tcp.resume();
    });
  }
}
