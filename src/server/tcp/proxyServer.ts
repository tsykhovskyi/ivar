import { Server, Socket } from 'net';
import { RedisClient } from '../../redis-client/redis-client';
import { TrafficHandler } from './trafficHandler';
import { SessionRepository } from '../../session/sessionRepository';

export interface TrafficOptions {
  intercept: boolean;
  luaFilters: string[]
}

export class ProxyServer {
  private net: Server;
  private trafficOptions: TrafficOptions;

  constructor(
    private sessionRepository: SessionRepository,
    private port: number,
    private redisPort: number,
    trafficOptions?: TrafficOptions
  ) {
    this.net = new Server(connection => this.onConnection(connection));
    this.trafficOptions = trafficOptions ?? {
      intercept: true,
      luaFilters: [],
    }
  }

  async onConnection(connection: Socket): Promise<void> {
    const redisClient = new RedisClient({ port: this.redisPort });
    const handler = new TrafficHandler(this.sessionRepository, this.trafficOptions, connection, redisClient);

    connection.on('close', () => redisClient.end());
    redisClient.on('close', () => connection.end());
    redisClient.on('error', (err) => {
      console.log('error on redis connection');
      connection.destroy(err);
    });
    redisClient.on('data', chunk => handler.onResponse(chunk));
    connection.on('data', chunk => handler.onRequest(chunk));

    // todo find the solution to abort tcp connection on initialization
    // problem
    // when client library establish connection with proxy, it think it was successfully connected to redis
    // after connection establish - library ignores errors until it will send request
    await redisClient.connect();
  }

  run() {
    this.net.listen(this.port, () => {
      console.log(`Redis port forwarding started: ${this.port}(debugger) -> ${this.redisPort}(redis)`);
    });
  }
}
