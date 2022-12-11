import { RequestInterceptor } from './types';
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
      this.traffic.debugStarted();
      const dbg = new TcpClientDebugger(
        this.traffic.client,
        request,
        serverState.state.syncMode
      );
      const session = new Session(dbg);
      sessionRepository.add(session);

      await session.start();
      const response = await session.finished();

      this.traffic.connection.write(response);
    } catch (err) {
      console.error('debugger session fail: ', err);
    } finally {
      this.traffic.debugFinished();
    }

    return true;
  }
}
