import { RESP } from '../../redis-client/resp';
import { RedisClient } from '../../redis-client/redis-client';
import { Socket } from 'net';
import { EvalShaRequestInterceptor } from './interceptors/evalShaRequestInterceptor';
import { EvalRequestInterceptor } from './interceptors/evalRequestInterceptor';
import { ClusterInterceptor } from './interceptors/clusterInterceptor';
import { InterceptorChain } from './interceptors/common/interceptorChain';
import { PassInterceptor } from './interceptors/passInterceptor';
import { InfoInterceptor } from './interceptors/infoInterceptor';

export class TrafficHandler {
  private readonly interceptors: InterceptorChain;

  constructor(
    public readonly connection: Socket,
    private readonly client: RedisClient,
    private monitorTraffic: boolean = true
  ) {
    this.interceptors = new InterceptorChain([
      new InfoInterceptor(this.client),
      new EvalShaRequestInterceptor(),
      new EvalRequestInterceptor(this.client),
      new ClusterInterceptor(this.client),
      new PassInterceptor(this.client),
    ]);
  }

  async onRequest(chunk: Buffer) {
    if (this.monitorTraffic) {
      this.logTrafficMessage(chunk.toString(), 'input');
    }

    const requests = RESP.decodeFull(chunk.toString()) as string[][];

    let response = '';
    for (const request of requests) {
      const requestResponse = await this.interceptors.handle(request);

      if (requestResponse === null) {
        throw new Error('unhandled request');
      }

      response += requestResponse;
    }

    if (this.monitorTraffic) {
      this.logTrafficMessage(response, 'output');
    }

    this.connection.write(response);
  }

  private logTrafficMessage(chunk: string, direction: 'input' | 'output') {
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

    const redisValues = RESP.decodeFull(chunk);
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
