import {
  Line,
  LuaDebuggerInterface,
  Variable,
} from '../lua-debugger-interface';
import { RedisClient } from '../../redis-client/redis-client';
import { ResponseParser } from './response/response-parser';
import { RedisValue, RESP } from '../../redis-client/resp';
import EventEmitter from 'events';

export declare interface TcpClientDebugger {
  on(event: 'finished', listener: (response: Buffer) => void): this;

  on(event: 'error', listener: (error: any) => void): this;
}

export class TcpClientDebugger
  extends EventEmitter
  implements LuaDebuggerInterface
{
  private responseParser: ResponseParser = new ResponseParser();
  private finished = false;

  constructor(
    private client: RedisClient,
    private evalCommand: string[],
    private syncMode: boolean
  ) {
    super();
    this.client.on('error', (err) => this.onError(err));
  }

  async start(): Promise<RedisValue> {
    await this.client.connect();
    await this.client.request([
      'SCRIPT',
      'DEBUG',
      this.syncMode ? 'SYNC' : 'YES',
    ]);
    return this.request(this.evalCommand);
  }

  async end(): Promise<void> {
    this.finished = true;
    this.client.removeAllListeners();
    this.client.end();
  }

  get isFinished(): boolean {
    return this.finished;
  }

  async step(): Promise<string[]> {
    const result = await this.request(['step']);
    return this.responseParser.toStrings(result);
  }

  async continue(): Promise<string[]> {
    const result = await this.request(['continue']);
    return this.responseParser.toStrings(result);
  }

  async abort(): Promise<string[]> {
    const result = await this.request(['abort']);
    return this.responseParser.toStrings(result);
  }

  async restart(): Promise<string[]> {
    this.client.end();
    const result = await this.start();
    return this.responseParser.toStrings(result);
  }

  async whole(): Promise<Line[]> {
    const redisValue = await this.request(['whole']);
    return this.responseParser.toSourceCode(redisValue);
  }

  async listBreakpoints(): Promise<string[]> {
    const result = await this.request(['break']);
    return this.responseParser.toStrings(result);
  }

  async addBreakpoint(line: number): Promise<string[]> {
    const result = await this.request(['break', line.toString()]);
    return this.responseParser.toStrings(result);
  }

  async removeBreakpoint(line: number): Promise<string[]> {
    const result = await this.request(['break', '-' + line.toString()]);
    return this.responseParser.toStrings(result);
  }

  async print(variable?: string): Promise<Variable[]> {
    const cmd = ['print'];
    if (!variable) {
      const result = await this.request(cmd);
      return this.responseParser.toVariables(result);
    }
    cmd.push(variable);

    const result = await this.request(cmd);

    return [
      {
        name: variable,
        value: this.responseParser.toSingleVariable(result),
      },
    ];
  }

  async trace(): Promise<string[]> {
    const result = await this.request(['trace']);
    return this.responseParser.toStrings(result);
  }

  private async request(cmd: string[]): Promise<RedisValue> {
    const response = await this.client.request(cmd);

    return new Promise((resolve) => {
      response.once('message', (resultMessage) => {
        const result = RESP.decode(resultMessage);
        if (
          Array.isArray(result) &&
          result[result.length - 1] === '<endsession>'
        ) {
          response.expectMessage();
          response.once('message', (sessionResultMessage) => {
            const sessionResult = RESP.decode(sessionResultMessage);
            console.log('TcpClientDebugger session ended:');
            console.log({ response: sessionResult });
            this.finished = true;
            this.emit('finished', sessionResultMessage);
            resolve(sessionResult);
          });
          return;
        }

        if (result instanceof Error) {
          this.finished = true;
          this.emit('finished', resultMessage);
        }

        resolve(result);
      });
    });
  }

  private async onError(error: any): Promise<void> {
    console.error('TcpClientDebugger error:', error);
    this.emit('error', error);
    await this.end();
  }
}
