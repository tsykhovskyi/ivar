import { ChildProcess, spawn } from "child_process";
import EventEmitter from "events";

const RESPONSE_TIMEOUT = 10_000;

export class Command extends EventEmitter {
  private cmd: ChildProcess | null = null;

  // private startupResponseResolver: Function | null = null;
  private responseResolver: Function | null = null;
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

    this.cmd.stdout?.on('data', this.onResponse.bind(this));
    this.cmd.stderr?.on('data', this.onResponse.bind(this));
    this.cmd.on('close', (code) => {
      this.emit('close', code);
    });
    this.cmd.on('message', message => {
      console.log('message', message);

    })

    return new Promise<string>(resolve => this.responseResolver = resolve);
  }

  async request(msg: string): Promise<string> {
    const cmd = this.cmd;
    if (!cmd) {
      throw new Error('command is not accessible')
    }

    const response = new Promise<string>(
      (resolve, reject) => {
        this.responseResolver = resolve;
      }
    );

    cmd.stdin?.write(msg + "\n");

    return response;
  }

  private onResponse(chunk: Uint8Array) {
    this.buffer += chunk.toString();
    const endOfResponse = chunk[chunk.length - 1] === 10; // it is still possible to receive partial with last symbol \n

    if (this.responseResolver) {
      if (endOfResponse) {
        this.responseResolver(this.buffer);
        this.responseResolver = null;
        this.buffer = '';
      }
    } else {
      console.error('unhandled cmd response', { buffer: this.buffer });
      this.buffer = '';
    }
  }

  close() {
    this.cmd?.stdin?.end();
  }
}
