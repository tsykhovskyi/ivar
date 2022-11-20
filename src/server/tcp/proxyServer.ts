import { Server, Socket } from 'net';
import { RedisClient } from '../../redis-client/redis-client';
import { TrafficHandler } from './trafficHandler';
import { sessionRepository } from '../../session/sessionRepository';

export class ProxyServer {
  private net: Server;

  constructor(private port: number) {
    this.net = new Server();
    this.net.on('connection', connection => this.onConnection(connection));
  }

  async onConnection(connection: Socket): Promise<void> {
    // todo fix dest port
    const redisClient = new RedisClient({ port: 30001 });
    await redisClient.connect();

    // todo sessionRepo should be passed convenient
    const handler = new TrafficHandler(sessionRepository, connection, redisClient);

    redisClient.on('data', chunk => handler.onResponse(chunk));
    connection.on('data', chunk => handler.onRequest(chunk, redisClient));

    redisClient.on('close', () => {
      connection.end();
    });
    connection.on('close', () => {
      redisClient.end();
    });
  }

  run() {
    this.net.listen(this.port, () => {
      console.log(`Proxy server started on ${this.port}`);
    });
  }
}
