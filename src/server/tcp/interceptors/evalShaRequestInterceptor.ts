import { serverState } from '../../http/serverState';
import { RESP } from '../../../redis-client/resp';
import { requestParser } from './common/requestParser';
import { RequestInterceptor } from './common/requestInterceptor';

export class EvalShaRequestInterceptor implements RequestInterceptor {
  async handle(request: string[]): Promise<string | null> {
    if (!requestParser.isCommand(request, 'EVALSHA')) {
      return null;
    }
    if (!serverState.isDebuggerEnabled()) {
      return null;
    }
    // Ask client to send script via eval
    return RESP.encode(
      new Error('NOSCRIPT No matching script. Please use EVAL.')
    );
  }
}
