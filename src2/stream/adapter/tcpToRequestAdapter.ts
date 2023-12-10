import { Duplex } from 'stream';
import { MessagesGroupExtractor } from '../../resp/parser/MessagesGroupExtractor';
import { Pipe } from '../pipe';
import Buffer from 'buffer';

export class TcpToRequestAdapter extends Duplex {
  private request: Pipe | null = null;

  private extractor = new MessagesGroupExtractor();

  constructor(protected $request: Duplex) {
    super();

    this.$request.on('data', (pipe: Pipe) => {
      pipe.on('data', (chunk: Buffer) => {
        this.push(chunk, 'ascii');
      });
      pipe.on('end', () => {
        this.uncork();
      });
    });

    this.$request.on('error', (error) => {
      this.destroy(error);
    });

    this.$request.on('end', () => {
      this.push(null);
    });
  }

  override _read(size: number) {
    this.$request.read(size);
  }

  override _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    if (this.request === null) {
      this.request = new Pipe();
      this.$request.write(this.request);
    }

    this.request.push(chunk, encoding);

    const pipeContour = this.extractor.add(chunk);
    if (pipeContour) {
      this.request.__complete(pipeContour);
      this.request = null;
      this.cork(); // until response is completely read
    }
    callback();
  }

// override _read(size: number) {
  //   this.origin.read(size);
  // }

  // override _final(callback: (error?: Error | null) => void) {
  //   this.origin.end(callback);
  // }
}
