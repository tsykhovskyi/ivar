import { Server, Socket } from 'net';
import { RedisClient } from '../../redis-client/redis-client';
import { RespConverter } from '../../redis-client/resp-converter';

export class ProxyServer {
  private net: Server;
  private converter: RespConverter;

  constructor(private port: number) {
    this.net = new Server();
    this.converter = new RespConverter();

    this.net.on('connection', connection => this.onConnection(connection));
  }

  async onConnection(connection: Socket): Promise<void> {
    // todo fix dest port
    const client = new RedisClient({ port: 30001 });
    await client.connect();

    client.on('data', response => {
      if (response.length > 256) {
        console.log({
          responseStart: response.slice(0, 128).toString(),
          responseEnd: response.slice(response.length-128).toString(),
          length: response.length
        });
      } else {
        console.log({ response: response});
      }
      connection.write(response);
    })

    connection.on('data', chunk => {
      const request = chunk.toString();
      const redisRequest = this.converter.decode(request);

      console.log({ request: request.toString() });

      client.write(chunk);
    });
    connection.on('close', () => {
      client.close();
    });
  }

  run() {
    this.net.listen(this.port, () => {
      console.log(`Proxy server started on ${this.port}`);
    });
  }
}
