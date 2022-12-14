import { TrafficHandler } from '../trafficHandler';
import { serverState } from '../../http/serverState';
import { TcpClientDebugger } from '../../../ldb/tcp/tcp-client-debugger';
import { Session } from '../../../session/session';
import { sessionRepository } from '../../../session/sessionRepository';
import { requestParser } from './common/requestParser';
import { RequestInterceptor } from './common/requestInterceptor';

export class EvalRequestInterceptor implements RequestInterceptor {
  constructor(private traffic: TrafficHandler) {}

  async handle(request: string[]) {
    if (!requestParser.isCommand(request, 'EVAL')) {
      return false;
    }

    if (!serverState.shouldInterceptScript(request[1])) {
      return false;
    }

    try {
      const dbg = new TcpClientDebugger(
        this.traffic.sideClient,
        request,
        serverState.state.syncMode
      );
      const session = sessionRepository.add(new Session(dbg));

      const response = await session.execute();

      this.traffic.onResponse(response);
    } catch (err) {
      console.error('debugger session fail: ', err);
    }

    return true;
  }
}
