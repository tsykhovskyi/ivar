import { Line, LuaDebuggerInterface, Variable } from "../lua-debugger-interface";
import { RedisClient } from "../../redis-client/redis-client";
import { ResponseParser } from "./response/response-parser";
import { RedisValue } from "../../redis-client/resp-converter";
import EventEmitter from "events";

export declare interface TcpClientDebugger {
  on(event: 'finished', listener: (response: Buffer) => void): this;

  on(event: 'error', listener: (error: any) => void): this;
}

export class TcpClientDebugger extends EventEmitter implements LuaDebuggerInterface {
  private responseParser: ResponseParser = new ResponseParser();
  private finished = false;

  constructor(private client: RedisClient) {
    super();
    this.client.on('error', (err) => this.onError(err));
  }

  async start(command: RedisValue): Promise<void> {
    await this.client.connect();
    await this.client.request(['SCRIPT', 'DEBUG', 'SYNC']);
    await this.client.request(command);
  }

  get isFinished(): boolean {
    return this.finished;
  }

  async step(): Promise<string[]> {
    const result = await this.client.request(['step']);
    this.handleStepResponse(result);
    return this.responseParser.toStrings(result);
  }

  async continue(): Promise<string[]> {
    const result = await this.client.request(['continue']);
    this.handleStepResponse(result);
    return this.responseParser.toStrings(result);
  }

  async abort(): Promise<string[]> {
    const result = await this.client.request(['abort']);
    this.handleStepResponse(result);
    return this.responseParser.toStrings(result);
  }

  async restart(): Promise<string[]> {
    const result = await this.client.request(['restart']);
    this.handleStepResponse(result);
    return this.responseParser.toStrings(result);
  }

  async whole(): Promise<Line[]> {
    const redisValue = await this.client.request(['whole']);
    return this.responseParser.toSourceCode(redisValue);
  }

  async listBreakpoints(): Promise<string[]> {
    const result = await this.client.request(['break']);
    return this.responseParser.toStrings(result);
  }

  async addBreakpoint(line: number): Promise<string[]> {
    const result = await this.client.request(['break', line.toString()]);
    return this.responseParser.toStrings(result);
  }

  async removeBreakpoint(line: number): Promise<string[]> {
    const result = await this.client.request(['break', '-' + line.toString()]);
    return this.responseParser.toStrings(result);
  }

  async print(variable?: string): Promise<Variable[]> {
    const cmd = ['print'];
    if (!variable) {
      const result = await this.client.request(cmd);
      return this.responseParser.toVariables(result);
    }
    cmd.push(variable);

    const result = await this.client.request(cmd);

    return [{
      name: variable,
      value: this.responseParser.toSingleVariable(result)
    }];
  }

  async trace(): Promise<string[]> {
    const result = await this.client.request(['trace']);
    return this.responseParser.toStrings(result);
  }

  private handleStepResponse(value: RedisValue) {
    if (Array.isArray(value) && value[value.length - 1] === "<endsession>") {
      this.finished = true;
      this.client.once('data', response => {
        console.log('TcpClientDebugger session ended:');
        console.log({ response });
        this.emit('finished', response);
      });
    }
  }

  private async onError(error: any): Promise<void> {
    this.finished = true;
    this.client.end();
    console.error('TcpClientDebugger error:', error);
    this.emit('error', error);
  }
}
