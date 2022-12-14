import { TrafficHandler } from '../trafficHandler';
import { requestParser } from './requestParser';
import { RequestInterceptor } from './requestInterceptor';
import { serverState } from '../../http/serverState';
import { RESPConverter } from '../../../redis-client/resp';

export class EvalShaRequestInterceptor implements RequestInterceptor {
  constructor(private traffic: TrafficHandler) {}

  handle(request: string[]) {
    if (!requestParser.isCommand(request, 'EVALSHA')) {
      return false;
    }
    if (!serverState.isDebuggerEnabled()) {
      return false;
    }
    // Ask client to send script via eval
    const reject = new Error('NOSCRIPT No matching script. Please use EVAL.');
    this.traffic.onResponse(RESPConverter.encode(reject));

    return true;
  }
}
