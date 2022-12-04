import { RedisValue, RESPConverter } from '../../redis-client/resp';
import { RedisClient } from '../../redis-client/redis-client';
import { Socket } from 'net';
import { sessionRepository, SessionRepository } from '../../session/sessionRepository';
import { Session } from '../../session/session';
import { TcpClientDebugger } from '../../ldb/tcp/tcp-client-debugger';
import { serverState } from '../http/serverState';

export class TrafficHandler {
  private debugMode: boolean = false;

  constructor(
    private sessions: SessionRepository,
    private connection: Socket,
    private client: RedisClient,
    private monitorTraffic: boolean = true,
  ) {
  }

  async onRequest(chunk: Buffer) {
    if (this.debugMode) {
      return console.debug(`skip incoming traffic (debug mode): ${chunk.length} bytes`);
    }

    const request = RESPConverter.decode(chunk.toString());

    if (this.monitorTraffic) {
      console.debug(`--> incoming message`);
      console.debug(request);
    }

    if (Array.isArray(request) && typeof request[0] === 'string') {
      const command = request[0].toUpperCase();

      if (command === 'EVALSHA') {
        // Ask client to send script via eval
        const scriptNotFoundMsg = '-NOSCRIPT No matching script. Please use EVAL.\r\n';
        this.connection.write(Buffer.from(scriptNotFoundMsg));
        console.debug('<-- outgoing message(hijacked)');
        console.debug(scriptNotFoundMsg);
        return;
      }

      if (command === 'EVAL' && typeof request[1] === 'string') {
        const lua = request[1];
        if (serverState.shouldInterceptScript(lua)) {
          try {
            this.debugMode = true;
            const dbg = new TcpClientDebugger(this.client, request, serverState.state.syncMode);
            const session = new Session(dbg);
            sessionRepository.add(session);

            await session.start();
            const response = await session.finished();
            this.debugMode = false;

            this.onResponse(response);
          } catch (err) {
            console.error('debugger session fail: ', err);
            this.debugMode = false;
          }
          return;
        }
      }
    }
    this.client.write(chunk);
  }

  onResponse(response: string) {
    if (this.debugMode) {
      return;
    }

    if (this.monitorTraffic) {
      if (response.length > 518) {
        console.debug('<-- outgoing traffic was trimmed');
        console.debug({
          first_256_bytes: response.slice(0, 256).toString(),
          last_256_bytes: response.slice(response.length - 256).toString(),
          size_in_bytes: response.length
        });
      } else {
        console.debug('<-- outgoing message');
        console.debug(RESPConverter.decode(response));
      }
    }

    this.connection.write(response);
  }
}
