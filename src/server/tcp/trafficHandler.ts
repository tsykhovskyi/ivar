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
import { httpServer } from '../http/httpServer';

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
    let reqId = '';
    if (this.monitorTraffic) {
      reqId = trafficRepository.logRequest(chunk.toString());
      console.debug(
        `[${new Date().toLocaleString()}] ${httpServer.address}/#/${reqId}`
      );
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
      trafficRepository.logResponse(reqId, response);
    }

    this.connection.write(response);
  }
}
