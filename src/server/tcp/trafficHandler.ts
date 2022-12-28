import { RESP } from '../../redis-client/resp';
import { RedisClient } from '../../redis-client/redis-client';
import { Socket } from 'net';
import { EvalShaRequestInterceptor } from './interceptors/evalShaRequestInterceptor';
import { EvalRequestInterceptor } from './interceptors/evalRequestInterceptor';
import { ClusterInterceptor } from './interceptors/clusterInterceptor';
import { InterceptorChain } from './interceptors/common/interceptorChain';
import { PassInterceptor } from './interceptors/passInterceptor';
import { InfoInterceptor } from './interceptors/infoInterceptor';
import { ScriptLoadInterceptor } from './interceptors/scriptLoadInterceptor';
import { trafficRepository } from '../../state/trafficRepository';

export class TrafficHandler {
  private readonly interceptors: InterceptorChain;

  constructor(
    public readonly connection: Socket,
    private readonly client: RedisClient,
    private readonly debugClient: RedisClient,
    private monitorTraffic: boolean = true
  ) {
    this.interceptors = new InterceptorChain([
      new InfoInterceptor(this.client),
      new ScriptLoadInterceptor(this.client),
      new EvalShaRequestInterceptor(this.debugClient),
      new EvalRequestInterceptor(this.debugClient),
      new ClusterInterceptor(this.client),
      new PassInterceptor(this.client),
    ]);
  }

  async onRequest(chunk: Buffer) {
    if (this.monitorTraffic) {
      this.logTrafficMessage(chunk.toString());
    }

    const requests = RESP.decodeRequest(chunk.toString()) as string[][];

    let response = '';
    for (const request of requests) {
      const requestResponse = await this.interceptors.handle(request);

      if (requestResponse === null) {
        throw new Error('unhandled request');
      }

      response += requestResponse;
    }

    if (this.monitorTraffic) {
      this.logTrafficMessage(chunk.toString(), response);
    }

    this.connection.write(response);
  }

  private logTrafficMessage(request: string, response?: string) {
    if (response == null) {
      console.debug(
        `[${new Date().toLocaleString()}] --> request (${request.length}) bytes`
      );
      console.debug(request);
      return;
    }

    console.debug(
      `[${new Date().toLocaleString()}] <-- response (${request.length}) bytes`
    );

    trafficRepository.log(request, response);
  }
}
