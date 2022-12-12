import { TrafficHandler } from '../trafficHandler';
import { requestParser } from './requestParser';
import { RequestInterceptor } from './requestInterceptor';
import { serverState } from '../../http/serverState';

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
    const scriptNotFoundMsg =
      '-NOSCRIPT No matching script. Please use EVAL.\r\n';
    this.traffic.onResponse(scriptNotFoundMsg);
    console.debug('<-- outgoing message(hijacked)');
    console.debug(scriptNotFoundMsg);

    return true;
  }
}
