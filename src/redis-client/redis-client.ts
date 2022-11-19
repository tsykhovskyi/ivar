import net from "net";
import EventEmitter from "events";
import { promisify } from "util";
import { RedisValue, RespConverter } from "./resp-converter";

type RedisValueCallback = (err: Error | null, value: RedisValue) => void;

type ConnectOptions = {
  host?: string;
  port?: number;
}

export declare interface RedisClient {
  on(eventName: 'connected', listener: () => void): this;
  once(eventName: 'connected', listener: () => void): this;

  on(eventName: 'data', listener: (chunk: string) => void): this;
  once(eventName: 'data', listener: (chunk: string) => void): this;

  on(eventName: 'response', listener: RedisValueCallback): this;
  once(eventName: 'response', listener: RedisValueCallback): this;

  on(eventName: 'error', listener: (error: any) => void): this;
  once(eventName: 'error', listener: (error: any) => void): this;
}

export class RedisClient extends EventEmitter {
  public readonly converter: RespConverter;

  private host: string;
  private port: number;
  private sock: net.Socket | null = null;

  private connected = false;
  private commandInProgress = false;

  constructor(connection?: ConnectOptions) {
    super();
    this.host = connection?.host ?? 'localhost';
    this.port = connection?.port ?? 6379;
    this.converter = new RespConverter();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      if (this.sock) {
        // throw new Error('Socket already created');
        reject('Socket already created');
      }
      const sock = new net.Socket();
      sock.setNoDelay();
      sock.setEncoding('utf8');
      sock.once('error', (error) => {
        reject(error);
      });
      sock.connect(this.port, this.host, () => {
        sock.once('end', () => {
          console.log('connection end');
        });

        sock.once('close', () => {
          console.log('connection close');
        });

        sock.on('data', (chunk) => {
          this.emit('data', chunk);
        });

        this.connected = true;
        this.emit('connected');

        resolve(true);
      });
      this.sock = sock;
    });
  }

  write(chunk: Buffer) {
    if (!this.sock) {
      throw new Error('Socket connection does not exist');
    }
    this.sock.write(chunk);
  }

  close() {
    if (this.sock) {
      this.sock.removeAllListeners();
      this.sock.destroy();
    }
  }

  cbRequest(request: RedisValue, cb: RedisValueCallback): void {
    if (!this.sock) {
      throw new Error('Socket connection does not exist');
    }
    if (!this.connected) {
      this.once('connected', () => {
        this.cbRequest(request, cb);
      });
    } else if (this.commandInProgress) {
      this.once('response', () => {
        this.cbRequest(request, cb);
      });
    } else {
      this.commandInProgress = true;

      const respCmd = this.converter.encode(request);
      this.sock.write(respCmd);

      this.once('data', chunk => {
        this.commandInProgress = false;

        try {
          const redisValue = this.converter.decode(chunk);
          cb(null, redisValue);
          this.emit('response', null, redisValue);
        } catch (err: any) {
          cb(err, null);
          this.emit('response', err, null);
        }
      });
    }
  }

  async request(cmd: RedisValue): Promise<RedisValue> {
    return promisify(this.cbRequest).call(this, cmd);
  }
}
