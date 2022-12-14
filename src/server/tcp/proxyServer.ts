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
        `Redis port forwarding started: ${this.port}(debugger) -> ${this.redisPort}(redis)`
      );
    });
  }

  private async onConnection(connection: Socket): Promise<void> {
    const redisClient = new RedisClient({ port: this.redisPort });
    const sideClient = new RedisClient({ port: this.redisPort });
    const handler = new TrafficHandler(connection, redisClient, sideClient);

    await redisClient.connect();
    await sideClient.connect();

    connection.on('close', () => redisClient.end());
    redisClient.on('close', () => connection.end());
    redisClient.on('error', (err) => {
      console.log('error on redis connection');
      connection.destroy(err);
    });
    redisClient.on('data', (chunk) => handler.onResponse(chunk));
    connection.on('data', (chunk) => handler.onRequest(chunk));
  }
}
