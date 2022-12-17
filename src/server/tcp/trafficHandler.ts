import { RESP } from '../../redis-client/resp';
import { RedisClient } from '../../redis-client/redis-client';
import { Socket } from 'net';
import { EvalShaRequestInterceptor } from './interceptors/evalShaRequestInterceptor';
import { EvalRequestInterceptor } from './interceptors/evalRequestInterceptor';
import { ClusterInterceptor } from './interceptors/clusterInterceptor';
import { InterceptorChain } from './interceptors/common/interceptorChain';
import { proxyPortsReplacer } from './interceptors/common/proxyPortsReplacer';

export class TrafficHandler {
  private readonly interceptors: InterceptorChain;
  private pipelineBuffer: string[] = [];
  private pipelineQueue = 0;

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

    const requests = RESP.decodeFull(chunk.toString()) as string[][];
    this.pipelineBuffer = [];
    this.pipelineQueue += requests.length;
    for (const request of requests) {
      if (!(await this.interceptors.handle(request))) {
        this.client.write(Buffer.from(RESP.encodeRequest(request)));
      }
    }
  }

  onResponse(response: string) {
    if (this.monitorTraffic) {
      this.logTrafficChunk(response, 'output');
    }

    if (response.startsWith('-MOVED ')) {
      response = proxyPortsReplacer.inIpPortLine(response);
    }

    if (this.pipelineQueue === 0) {
      console.log('------> sent raw');
      this.connection.write(response);
      return;
    }

    this.pipelineQueue -= 1;
    this.pipelineBuffer.push(response);
    if (this.pipelineQueue === 0) {
      console.log('------> sent');
      this.connection.write(this.pipelineBuffer.join(''));
      this.pipelineBuffer = [];
    }
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
