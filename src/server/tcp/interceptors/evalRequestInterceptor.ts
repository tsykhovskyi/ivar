import { RequestInterceptor } from './requestInterceptor';
import { TrafficHandler } from '../trafficHandler';
import { RedisValue } from '../../../redis-client/resp';
import { requestParser } from './requestParser';
import { serverState } from '../../http/serverState';
import { TcpClientDebugger } from '../../../ldb/tcp/tcp-client-debugger';
import { Session } from '../../../session/session';
import { sessionRepository } from '../../../session/sessionRepository';

export class EvalRequestInterceptor implements RequestInterceptor {
  constructor(private traffic: TrafficHandler) {}

  async handle(request: RedisValue) {
    if (!requestParser.isCommand(request, 'EVAL')) {
      return false;
    }

    if (
      typeof request[1] !== 'string' ||
      !serverState.shouldInterceptScript(request[1])
    ) {
      return false;
    }

    try {
      const dbg = new TcpClientDebugger(
        this.traffic.sideClient,
        request,
        serverState.state.syncMode
      );
      const session = new Session(dbg);
      sessionRepository.add(session);

      const response = await session.execute();

      this.traffic.onResponse(response);
    } catch (err) {
      console.error('debugger session fail: ', err);
    }

    return true;
  }
}
