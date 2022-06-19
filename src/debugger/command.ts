import { ChildProcess, spawn } from "child_process";
import EventEmitter from "events";

const RESPONSE_TIMEOUT = 10_000;

export class Command extends EventEmitter {
  private cmd: ChildProcess | null = null;

  private startupResponseResolver: Function | null = null;

  private responseResolver: Function | null = null;
  private responseRejector: Function | null = null;

  private buffer: string = '';
  private responseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private args: string[]) {
    super()
  }

  async init(): Promise<string> {
    if (this.cmd) {
      console.log('already initialized');
      return '';
    }
    this.cmd = spawn(this.args[0], this.args.slice(1));

    // this.cmd.stderr?.on('data', (data) => {
    //   console.error(`stderr: ${data}`);
    //   this.responseRejector?.();
    // });
    this.cmd.stdout?.on('data', this.onResponse.bind(this));
    this.cmd.stderr?.on('data', this.onResponse.bind(this));
    this.cmd.on('close', (code) => {
      this.emit('close', code);
    });
    this.cmd.on('message', message => {
      console.log('message', message);

    })

    return new Promise<string>(resolve => this.startupResponseResolver = resolve);
  }

  async request(msg: string): Promise<string> {
    const cmd = this.cmd;
    if (!cmd) {
      throw new Error('command is not accessible')
    }

    const response = new Promise<string>(
      (resolve, reject) => {
        this.responseResolver = resolve;
        // this.responseRejector = reject;
        // setTimeout(() => reject(`Timout ${RESPONSE_TIMEOUT}ms exceeded`), RESPONSE_TIMEOUT);
      }
    );

    cmd.stdin?.write(msg + "\n");

    return response;
  }

  private onResponse(chunk: Uint8Array) {
    this.buffer += chunk.toString();

    if (this.startupResponseResolver !== null) {
      this.startupResponseResolver(this.buffer);
      this.startupResponseResolver = null;
      this.buffer = ''
      return;
    }


    if (this.responseTimer !== null) {
      clearTimeout(this.responseTimer);
    }
    this.responseTimer = setTimeout(() => {
      if (this.responseResolver) {
        this.responseResolver(this.buffer);
        this.responseResolver = null;
        this.responseRejector = null;
      } else {
        console.error('unhandled cmd response', { buffer: this.buffer });
      }
      this.buffer = '';
    }, 5);
  }

  close() {
    this.cmd?.stdin?.end();
  }
}
