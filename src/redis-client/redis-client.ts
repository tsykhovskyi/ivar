import net from "net";
import EventEmitter from "events";
import { promisify } from "util";
import { RedisValue, RespCoder } from "./resp-coder";

type StringCallback = (err: Error | null, result: string) => void;
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
}

export class RedisClient extends EventEmitter {
  private host: string;
  private port: number;

  protocol: RespCoder;

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
      sock.on('end', () => {
        console.log('connection ended ');
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
        const result = this.protocol.parseResponse(respData);
        cb(null, result);
        this.commandInProgress = false;
        this.emit('response', null, result);
      });
    }
  }

  async request(cmd: string[]): Promise<RedisValue> {
    return promisify(this.cbRequest).call(this, cmd);
  }

  private connectionError(err: any) {
    console.error(err);
  }
}
