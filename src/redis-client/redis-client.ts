import net from "net";
import EventEmitter from "events";
import { promisify } from "util";
import { RedisValue, RespCoder } from "./resp-coder";
import { errorMonitor } from "ws";

type RedisValueCallback = (err: Error | null, value: RedisValue) => void;

type ConnectOptions = {
  host?: string;
  port?: number;
}

export declare interface RedisClient {
  on(eventName: 'connected', listener: () => void): this;

  once(eventName: 'connected', listener: () => void): this;

  on(eventName: 'response', listener: RedisValueCallback): this;

  once(eventName: 'response', listener: RedisValueCallback): this;

  on(eventName: 'error', listener: (error: any) => void): this;

  once(eventName: 'error', listener: (error: any) => void): this;
}

export class RedisClient extends EventEmitter {
  private host: string;
  private port: number;
  private protocol: RespCoder;
  private sock: net.Socket | null = null;

  private connected = false;
  private commandInProgress = false;

  constructor(connection?: ConnectOptions) {
    super();
    this.host = connection?.host ?? 'localhost';
    this.port = connection?.port ?? 6379;
    this.protocol = new RespCoder();
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
          try {
            const redisValue = this.parseRedisChunk(chunk);
            // debugging info
            console.log('resp data: ', redisValue);
            this.emit('response', null, redisValue);
          } catch (err) {
            this.emit('response', err, null);
          }
        });

        this.connected = true;
        this.emit('connected');

        resolve(true);
      });
      this.sock = sock;
    });
  }

  close() {
    if (this.sock) {
      this.sock.removeAllListeners();
      this.sock.destroy();
    }
  }

  cbRequest(cmd: string[], cb: RedisValueCallback): void {
    if (!this.sock) {
      throw new Error('Socket connection does not exist');
    }
    if (!this.connected) {
      this.once('connected', () => {
        this.cbRequest(cmd, cb);
      });
    } else if (this.commandInProgress) {
      this.once('response', () => {
        this.cbRequest(cmd, cb);
      });
    } else {
      this.commandInProgress = true;

      const respCmd = this.protocol.serializeCommand(cmd);
      this.sock.write(respCmd);

      this.once('response', (err, redisValue) => {
        this.commandInProgress = false;

        cb(err, redisValue);
      });
    }
  }

  private parseRedisChunk(chunk: Buffer): RedisValue {
    const respData = chunk.toString();
    const redisValue = this.protocol.parseResponse(respData);
    if (redisValue.length > 1) {
      console.warn(`Redis response was not fully processed. ${redisValue.length - 1} redis values left unprocessed`);
    }
    return redisValue[0];
  }

  async request(cmd: string[]): Promise<RedisValue> {
    return promisify(this.cbRequest).call(this, cmd);
  }
}
