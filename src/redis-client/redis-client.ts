import net from "net";
import EventEmitter from "events";
import { promisify } from "util";
import { RedisValue, RespCoder } from "./resp-coder";

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

  connect() {
    if (this.sock) {
      throw new Error('Socket already created');
    }
    const sock = new net.Socket();
    sock.setNoDelay();
    sock.setEncoding('utf8');
    sock.once('error', this.connectionError);
    sock.connect(this.port, this.host, () => {
      sock.once('end', () => {
        console.log('connection end');
      });

      sock.once('close', () => {
        console.log('connection close');
      });

      sock.on('data', (data) => {
        // debugging info
        console.log(this.protocol.parseResponse(data.toString()));
      });

      this.connected = true;
      this.emit('connected');
    });
    this.sock = sock;

    return this;
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

      this.sock.once('data', chunk => {
        const respData = chunk.toString();
        this.commandInProgress = false;

        try {
          const [redisValue] = this.protocol.parseResponse(respData);
          cb(null, redisValue);
          this.emit('response', null, redisValue);
        } catch (redisError: any) {
          cb(redisError, []);
          this.emit('error', redisError, []);
        }
      });
    }
  }

  async request(cmd: string[]): Promise<RedisValue> {
    return promisify(this.cbRequest).call(this, cmd);
  }

  private connectionError(err: any) {
    this.emit('error', err);
  }
}
