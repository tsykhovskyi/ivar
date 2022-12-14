import { RESPConverter } from '../../redis-client/resp';
import { RedisClient } from '../../redis-client/redis-client';
import { Socket } from 'net';
import { EvalShaRequestInterceptor } from './interceptors/evalShaRequestInterceptor';
import { EvalRequestInterceptor } from './interceptors/evalRequestInterceptor';
import { ClusterInterceptor } from './interceptors/clusterInterceptor';
import { portsSubstitutor } from './interceptors/portsSubstitutor';
import { InterceptorChain } from './interceptors/interceptorChain';

export class TrafficHandler {
  private readonly interceptors: InterceptorChain;

  constructor(
    public readonly connection: Socket,
    private readonly client: RedisClient,
    public readonly sideClient: RedisClient,
    private monitorTraffic: boolean = true
  ) {
    this.interceptors = new InterceptorChain([
      new EvalShaRequestInterceptor(this),
      new EvalRequestInterceptor(this),
      new ClusterInterceptor(this),
    ]);
  }

  async onRequest(chunk: Buffer) {
    if (this.monitorTraffic) {
      this.logTrafficChunk(chunk.toString(), 'input');
    }

    const request = RESPConverter.decode(chunk.toString());

    if (!(await this.interceptors.handle(request as string[]))) {
      this.client.write(chunk);
    }
  }

  onResponse(response: string) {
    if (this.monitorTraffic) {
      this.logTrafficChunk(response, 'output');
    }

    if (response.startsWith('-MOVED ')) {
      response = portsSubstitutor.inIpPortLine(response);
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
