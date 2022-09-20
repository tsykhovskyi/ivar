import { ChildProcess, spawn } from "child_process";
import EventEmitter from "events";

interface Logger {
  log(data: any): void;
}

class ConsoleLogger {
  log(data: any) {
    if (process.env.DEBUG === 'true') {
      console.dir(data);
    }
  }
}

const DEFAULT_RESPONSE_HANDLER_DELAY_MS = 7;

export class Commander extends EventEmitter {
  private cmd: ChildProcess | null = null;

  private lastMS = 0;
  private requestBuffer: string[] = [];

  private responseResolver: Function | null = null;
  private responseRejector: Function | null = null;
  private buffer: string = '';
  private responseHandleTimer: NodeJS.Timeout | null = null;

  constructor(
    private args: string[],
    private responseHandlerDelayMs: number = DEFAULT_RESPONSE_HANDLER_DELAY_MS,
    private logger: Logger = new ConsoleLogger()
  ) {
    super()
  }

  async init(): Promise<string> {
    if (this.cmd) {
      return Promise.resolve('');
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

    this.requestBuffer.push(msg);
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
    this.logChunk(chunk);

    // clear current response timer if exists
    if (this.responseHandleTimer) {
      clearTimeout(this.responseHandleTimer)
    }
    // set timer for response resolve which allows to not miss delayed request chunks.
    this.responseHandleTimer = setTimeout(() => {
      if (this.responseResolver) {
        this.responseResolver(this.buffer);
      }
      this.responseResolver = null;
      this.responseRejector = null;
      this.buffer = '';
    }, this.responseHandlerDelayMs);
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

  private logChunk(chunk: Uint8Array) {
    const now = Date.now();
    const msg = chunk.toString();
    this.logger.log({
      requests: this.requestBuffer,
      deltaMS: now - this.lastMS,
      chunk: msg,
      buffer: this.buffer,
    });
    this.lastMS = now;
    this.requestBuffer = []

  }
}
