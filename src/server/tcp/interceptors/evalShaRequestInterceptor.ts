import { TrafficHandler } from '../trafficHandler';
import { serverState } from '../../http/serverState';
import { RESP } from '../../../redis-client/resp';
import { requestParser } from './common/requestParser';
import { RequestInterceptor } from './common/requestInterceptor';

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
    this.traffic.onResponse(RESP.encode(reject));

    return true;
  }
}
