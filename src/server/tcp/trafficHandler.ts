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
import { IncompleteChunkError } from '../../redis-client/resp/exception/incompleteChunkError';
import { RedisRequest } from '../../redis-client/resp/types';

export class TrafficHandler {
  private readonly interceptors: InterceptorChain;
  private payloadBuffer = '';

  constructor(
    public readonly connection: Socket,
    private readonly client: RedisClient,
    // @ts-ignore
    private readonly debugClient: RedisClient,
    private readonly proxy: { src: number; dst: number },
    private monitorTraffic: boolean = true
  ) {
    this.interceptors = new InterceptorChain([
      new InfoInterceptor(this.client),
      new ScriptLoadInterceptor(this.client),
      new EvalShaRequestInterceptor(this.client),
      new EvalRequestInterceptor(this.client),
      new ClusterInterceptor(this.client),
      new PassInterceptor(this.client),
    ]);
  }

  async onRequest(chunk: Buffer) {
    const payload = chunk.toString('binary');

    let requests: RedisRequest[] = [];
    let response = '';
    let reqId = '';

    try {
      this.payloadBuffer += payload;
      requests = RESP.decodeRequest(this.payloadBuffer);
      if (this.monitorTraffic) {
        reqId = trafficRepository.logRequest(this.payloadBuffer, this.proxy);
        console.debug(
          `[${new Date().toLocaleString()}] ${httpServer.address}/#/${reqId}`
        );
      }
      this.payloadBuffer = '';
    } catch (err) {
      if (err instanceof IncompleteChunkError) {
        console.log(
          `chunk is incompleted. payload ${this.payloadBuffer.length} bytes`
        );
      }
      return;
    }

    for (const request of requests) {
      console.log(`request started [${request[0]}]`);
      const requestResponse = await this.interceptors.handle(request);

      if (requestResponse === null) {
        throw new Error('unhandled request');
      }

      response += requestResponse;
    }

    if (this.monitorTraffic) {
      trafficRepository.logResponse(reqId, response);
    }

    const responseBuf = Buffer.from(response, 'binary');
    this.connection.write(responseBuf);
  }
}
