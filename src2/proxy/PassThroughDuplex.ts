import { Duplex } from 'stream';

export class PassThroughDuplex extends Duplex {
  constructor(protected origin: Duplex) {
    super();

    this.origin.on('data', (chunk) => {
      this.onRead(chunk);
      this.push(chunk);
    });

    this.origin.on('error', (error) => {
      this.destroy(error);
    });

    this.origin.on('end', () => {
      this.end();
    });
  }

  override _read(size: number) {
    this.origin.read(size);
  }

  override _destroy(error: Error | null, callback: (error: (Error | null)) => void) {
    this.origin.destroy(error ?? undefined);
    callback(error);
  }

  protected onRead(chunk: Buffer): void {
    return;
  }

  override _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.onWrite(chunk, encoding);
    this.origin.write(chunk, encoding, callback);
  }

  protected onWrite(chunk: Buffer, encoding: BufferEncoding): void {
    return;
  }

  override _final(callback: (error?: Error | null) => void) {
    this.origin.end(callback);
  }
}
