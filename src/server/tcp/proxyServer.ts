import { Server, Socket } from 'net';
import { RedisClient } from '../../redis-client/redis-client';
import { TrafficHandler } from './trafficHandler';
import { sessionRepository } from '../../session/sessionRepository';

export class ProxyServer {
  private net: Server;

  constructor(private port: number, private redisPort: number, private luaFilters: string[]) {
    this.net = new Server();
    this.net.on('connection', connection => this.onConnection(connection));
  }

  async onConnection(connection: Socket): Promise<void> {
    const redisClient = new RedisClient({ port: this.redisPort });

    connection.on('close', () => redisClient.end());
    redisClient.on('close', () => connection.end());
    redisClient.on('error', () => {
      console.log('error on redis connection');
      connection.end();
      return;
    });

    // todo find the solution to abort tcp connection on initialization
    // problem
    // when client library establish connection with proxy, it think it was successfully connected to redis
    // after connection establish - library ignores errors until it will send request
    await redisClient.connect();

    const handler = new TrafficHandler(sessionRepository, this.luaFilters, connection, redisClient);

    redisClient.on('data', chunk => handler.onResponse(chunk));
    connection.on('data', chunk => handler.onRequest(chunk));

  }

  run() {
    this.net.listen(this.port, () => {
      console.log(`Proxy server started on ${this.port}`);
    });
  }
}
