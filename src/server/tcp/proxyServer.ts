import { Server, Socket } from 'net';
import { RedisClient } from '../../redis-client/redis-client';
import { TrafficHandler } from './trafficHandler';

export class ProxyServer {
  private net: Server;

  constructor(private port: number, private redisPort: number) {
    this.net = new Server({ allowHalfOpen: true }, (connection) =>
      this.onConnection(connection)
    );
  }

  run() {
    this.net.listen(this.port, () => {
      console.log(
        `Redis port forwarding started: ${this.port} (debugger) -> ${this.redisPort} (redis)`
      );
    });
  }

  private async onConnection(connection: Socket): Promise<void> {
    const redisClient = new RedisClient({
      port: this.redisPort,
      autoReconnect: true,
    });
    // todo only 1 redis connection. probably need to refactor RedisClient
    const debugClient = new RedisClient({
      port: this.redisPort,
      autoReconnect: true,
    });
    const handler = new TrafficHandler(connection, redisClient, debugClient, {
      src: this.port,
      dst: this.redisPort,
    });

    let pendingRequest: Promise<void> | null = null;
    let shouldClose = false;
    const tryCloseConnection = () =>
      shouldClose && !pendingRequest && connection.end();
    redisClient.on('close', () => {
      console.log('connection is closing');
      connection.end();
    });

    const handle = (chunk: Buffer) => {
      if (pendingRequest !== null) {
        pendingRequest.then(() => handle(chunk));
      }
      pendingRequest = handler.onRequest(chunk);
      pendingRequest.then(() => {
        pendingRequest = null;
        tryCloseConnection();
      });
    };

    connection.on('data', handle);
    connection.on('end', () => {
      shouldClose = true;
      tryCloseConnection();
    });
    connection.on('close', () => {
      redisClient.end();
    });

    await redisClient.connect();
  }
}
