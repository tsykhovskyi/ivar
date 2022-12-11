import { RedisValue } from '../../../redis-client/resp';
import { TrafficHandler } from '../trafficHandler';
import { requestParser } from './requestParser';
import { RequestInterceptor } from './types';

export class EvalShaRequestInterceptor implements RequestInterceptor {
  constructor(private traffic: TrafficHandler) {}

  handle(request: RedisValue) {
    if (!requestParser.isCommand(request, 'EVALSHA')) {
      return false;
    }
    // Ask client to send script via eval
    const scriptNotFoundMsg =
      '-NOSCRIPT No matching script. Please use EVAL.\r\n';
    this.traffic.connection.write(Buffer.from(scriptNotFoundMsg));
    console.debug('<-- outgoing message(hijacked)');
    console.debug(scriptNotFoundMsg);

    return true;
  }
}
