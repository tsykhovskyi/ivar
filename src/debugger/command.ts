import { ChildProcess, spawn } from "child_process";
import EventEmitter from "events";

export class Command extends EventEmitter {
  private cmd: ChildProcess | null = null;

  private responseResolver: Function | null = null;
  private responseRejector: Function | null = null;
  private buffer: string = '';

  constructor(private args: string[]) {
    super()
  }

  async init(): Promise<string> {
    if (this.cmd) {
      console.log('already initialized');
      return '';
    }
    this.cmd = spawn(this.args[0], this.args.slice(1));

    this.cmd.stdout?.on('data', this.onStdout.bind(this));
    this.cmd.stderr?.on('data', this.onStderr.bind(this));
    this.cmd.on('close', (code) => {
      this.emit('close', code);
    });

    return this.makeResponse();
  }

  request(msg: string): Promise<string> {
    const cmd = this.cmd;
    if (!cmd) {
      throw new Error('command is not accessible')
    }

    cmd.stdin?.write(msg + "\n");

    return this.makeResponse();
  }

  makeResponse(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.responseResolver = resolve;
      this.responseRejector = reject;
    });
  }

  private onStdout(chunk: Uint8Array) {
    this.buffer += chunk.toString();
    const endOfResponse = chunk[chunk.length - 1] === 10; // it is still possible to receive partial with last symbol \n

    if (this.responseResolver) {
      if (endOfResponse) {
        this.responseResolver(this.buffer);
        this.responseResolver = null;
        this.responseRejector = null;
        this.buffer = '';
      }
    } else {
      console.error('unhandled cmd response', { buffer: this.buffer });
      this.buffer = '';
    }
  }

  private onStderr(chunk: Uint8Array) {
    if (this.responseRejector) {
      this.responseRejector(chunk.toString());
      this.responseResolver = null;
      this.responseRejector = null;
      this.buffer = '';
    }
  }

  close() {
    this.cmd?.stdin?.end();
  }
}
