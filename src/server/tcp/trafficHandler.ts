import { RedisValue, RESPConverter, RespConverter } from '../../redis-client/resp-converter';
import { RedisClient } from '../../redis-client/redis-client';
import { Socket } from 'net';
import { sessionRepository, SessionRepository } from '../../session/sessionRepository';
import { Session } from '../../session/session';
import { TcpClientDebugger } from '../../ldb/tcp/tcp-client-debugger';

export class TrafficHandler {
  private converter: RespConverter;
  private debugMode: boolean = false;

  constructor(private sessions: SessionRepository, private luaFilters: string[], private connection: Socket, private client: RedisClient) {
    this.converter = RESPConverter;
  }

  async onRequest(chunk: Buffer) {
    if (this.debugMode) {
      return console.debug(`debug mode. skip response: ${chunk.length} bytes`);
    }

    const request = this.converter.decode(chunk.toString());

    if (Array.isArray(request) && typeof request[0] === 'string') {
      const command = request[0].toUpperCase();

      if (command === 'EVALSHA') {
        // Ask client to send script via eval
        this.connection.write(Buffer.from('-NOSCRIPT No matching script. Please use EVAL.\r\n'));
        return;
      }

      if (command === 'EVAL' && typeof request[1] === 'string') {
        const lua = request[1];
        const hasMatch =
          this.luaFilters.length === 0
          || this.luaFilters.findIndex(f => lua.indexOf(f) !== -1) !== -1;

        if (hasMatch) {
          try {
            this.debugMode = true;
            await this.runSession(request);
          } catch (err) {
            console.error('debugger session fail: ', err);
          } finally {
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
      return console.debug(`debug mode. skip response: ${response.length} bytes`);
    }

    if (response.length > 256) {
      console.log({
        responseStart: response.slice(0, 128).toString(),
        responseEnd: response.slice(response.length - 128).toString(),
        length: response.length
      });
    } else {
      console.log({ response: response });
    }
    this.connection.write(response);
  }

  private async runSession(request: RedisValue) {
    const session = new Session(new TcpClientDebugger(this.client));
    sessionRepository.add(session);

    await session.start(request);
    const response = await session.finished();

    this.connection.write(response);
  }
}
