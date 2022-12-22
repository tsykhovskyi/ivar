import { Server, Socket } from 'net';
import { RedisClient } from '../../redis-client/redis-client';
import { TrafficHandler } from './trafficHandler';

export class ProxyServer {
  private net: Server;

  constructor(private port: number, private redisPort: number) {
    this.net = new Server((connection) => this.onConnection(connection));
  }

  run() {
    this.net.listen(this.port, () => {
      console.log(
        `Redis port forwarding started: ${this.port} (debugger) -> ${this.redisPort} (redis)`
      );
    });
  }

  private async onConnection(connection: Socket): Promise<void> {
    const redisClient = new RedisClient({ port: this.redisPort });
    const debugClient = new RedisClient({
      port: this.redisPort,
      autoReconnect: true,
    });
    const handler = new TrafficHandler(connection, redisClient, debugClient);

    redisClient.on('close', () => {
      connection.end();
    });
    connection.on('data', (chunk) => handler.onRequest(chunk));
    connection.on('close', () => {
      redisClient.end();
    });

    await redisClient.connect();
  }
}
