import { Duplex } from 'stream';
import Buffer from 'buffer';
import { Pipe } from './pipe';
import { PipeContour } from '../resp/parser/MessagesGroupExtractor';
import { logMessage } from '../resp/utils/logger';

export class TrafficLogger extends Duplex {
  constructor(private $origin: Duplex) {
    super({
      objectMode: true,
    });

    this.$origin.on('data', (pipe: Pipe) => {
      this.push(pipe);
      pipe.on('data', (chunk: Buffer) => {
        this.logChunk('IN', chunk);
      });
      pipe.on('completed', (contour: PipeContour) => {
        logMessage('Response', contour);
      });
    });
  }

  override _read(size: number) {
    this.$origin.read(size);
  }

  override _write(pipe: Pipe, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.$origin.write(pipe, callback);
    pipe.on('data', (chunk: Buffer) => {
      this.logChunk('OUT', chunk);
    });
    pipe.on('completed', (contour: PipeContour) => {
      logMessage('Request', contour);
    });
  }

  protected logChunk(type: 'IN' | 'OUT', chunk: Buffer) {
    console.log(`[${type} ${chunk.length} bytes]: ` + chunk.toString().substring(0, 64).replaceAll('\r\n', '\\r\\n'));
  }
}
