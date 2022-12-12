import { RESPConverter } from '../../redis-client/resp';
import { RedisClient } from '../../redis-client/redis-client';
import { Socket } from 'net';
import { RequestInterceptor } from './interceptors/requestInterceptor';
import { EvalShaRequestInterceptor } from './interceptors/evalShaRequestInterceptor';
import { EvalRequestInterceptor } from './interceptors/evalRequestInterceptor';
import { ClusterNodesInterceptor } from './interceptors/clusterNodesInterceptor';

export class TrafficHandler {
  private readonly requestHandlers: RequestInterceptor[];

  constructor(
    public readonly connection: Socket,
    private readonly client: RedisClient,
    public readonly sideClient: RedisClient,
    private monitorTraffic: boolean = true
  ) {
    this.requestHandlers = [
      new EvalShaRequestInterceptor(this),
      new EvalRequestInterceptor(this),
      new ClusterNodesInterceptor(this),
    ];
  }

  async onRequest(chunk: Buffer) {
    if (this.monitorTraffic) {
      this.logTrafficChunk(chunk.toString(), 'input');
    }

    const request = RESPConverter.decode(chunk.toString());

    let requestHandled = false;
    for (const requestHandler of this.requestHandlers) {
      if (!requestHandled) {
        requestHandled = await requestHandler.handle(request);
      }
    }

    if (!requestHandled) {
      this.client.write(chunk);
    }
  }

  onResponse(response: string) {
    if (this.monitorTraffic) {
      this.logTrafficChunk(response, 'output');
    }

    this.connection.write(response);
  }

  private logTrafficChunk(chunk: string, direction: 'input' | 'output') {
    if (direction === 'input') {
      console.debug(`[${new Date().toLocaleString()}] --> incoming message`);
    } else {
      console.debug(`[${new Date().toLocaleString()}] <-- outgoing traffic`);
    }

    if (chunk.length > 1024) {
      console.debug('[note] message was trimmed to 1024 bytes...');
      console.debug(chunk.slice(0, 1024).toString() + '...\n');
      return;
    }

    const redisValues = RESPConverter.decodeFull(chunk);
    if (redisValues.length > 1) {
      console.debug(
        `[note] message contains ${redisValues.length} redis values`
      );
    }

    for (const redisValue of redisValues) {
      console.debug(redisValue);
    }
  }
}
