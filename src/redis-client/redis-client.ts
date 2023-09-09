import net from 'net';
import EventEmitter from 'events';
import { promisify } from 'util';
import { RESP } from './resp';
import { Response } from './request/response';

type RedisValueCallback = (err: Error | null, value: Response) => void;

type ConnectOptions = {
  host?: string;
  port?: number;
  autoReconnect?: boolean;
};

export declare interface RedisClient {
  on(eventName: 'connected', listener: () => void): this;
  once(eventName: 'connected', listener: () => void): this;

  on(eventName: 'data', listener: (chunk: string) => void): this;
  once(eventName: 'data', listener: (chunk: string) => void): this;

  on(eventName: 'response', listener: RedisValueCallback): this;
  once(eventName: 'response', listener: RedisValueCallback): this;

  on(eventName: 'error', listener: (error: any) => void): this;
  once(eventName: 'error', listener: (error: any) => void): this;

  on(eventName: 'close', listener: () => void): this;
  once(eventName: 'close', listener: () => void): this;
}

export class RedisClient extends EventEmitter {
  private readonly host: string;
  private readonly port: number;
  private readonly autoReconnect: boolean;
  private sock: net.Socket | null = null;

  private connected = false;
  private closedWithError = false;
  private pendingResponse: Response | null = null;

  constructor(connection?: ConnectOptions) {
    super();
    this.host = connection?.host ?? 'localhost';
    this.port = connection?.port ?? 6379;
    this.autoReconnect = connection?.autoReconnect ?? false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      if (this.sock) {
        resolve(true);
      }
      const sock = new net.Socket();
      sock.setNoDelay();
      sock.once('error', (error) => {
        console.log('[redis-client] connection close', error);
        this.closedWithError = true;
        this.emit('error', error);
        reject(error);
      });
      sock.connect(this.port, this.host, () => {
        sock.once('close', () => {
          console.log('client close connection');
          this.end();
          if (this.autoReconnect && !this.closedWithError) {
            this.connect();
          } else {
            this.emit('close');
          }
        });

        sock.on('data', (chunk: Buffer) => {
          console.log('[client response]:', chunk.toString().substring(0, 16));
          this.emit('data', chunk);
          if (this.pendingResponse !== null) {
            this.pendingResponse.chunkReceived(chunk.toString('binary'));
          } else {
            console.log('missed response', chunk);
          }
        });

        this.connected = true;
        this.emit('connected');

        resolve(true);
      });
      this.sock = sock;
    });
  }

  end() {
    this.connected = false;
    if (this.sock) {
      this.sock.removeAllListeners();
      this.sock.destroy();
      this.sock = null;
    }
    if (this.pendingResponse) {
      this.pendingResponse.destroy();
      this.pendingResponse = null;
    }
    if (this.autoReconnect && !this.closedWithError) {
      this.connect();
    }
  }

  cbRequest(request: string[], cb: RedisValueCallback): void {
    if (this.closedWithError) {
      cb(new Error('Server closed connection'), new Response());
      return;
    }

    if (!this.connected) {
      this.once('connected', () => {
        this.cbRequest(request, cb);
      });
      return;
    }

    if (this.pendingResponse) {
      this.pendingResponse.once('end', () => {
        this.cbRequest(request, cb);
      });
      return;
    }

    this.pendingResponse = new Response();
    this.pendingResponse.once('end', () => {
      this.pendingResponse = null;
    });

    console.log('[client request]:', request);
    const respCmd = RESP.encodeRequest(request);
    const buf = Buffer.from(respCmd, 'binary');

    if (!this.sock) {
      throw new Error('Socket connection does not exist');
    }
    this.sock.write(buf);

    cb(null, this.pendingResponse);
  }

  async request(cmd: string[]): Promise<Response> {
    return promisify(this.cbRequest).call(this, cmd);
  }
}
