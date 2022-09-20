import { Line, LuaDebuggerInterface, LuaPlainRequest, Variable } from "../lua-debugger-interface";
import { RedisClient } from "../../redis-client/redis-client";
import { ResponseParser } from "./response/response-parser";

export class TcpClientDebugger implements LuaDebuggerInterface {
  private client: RedisClient;
  private responseParser: ResponseParser;

  constructor(private request: LuaPlainRequest) {
    this.client = new RedisClient({ ...request.redis });
    this.responseParser = new ResponseParser();
  }

  async init(): Promise<void> {
    this.client.connect();
    await this.client.request(['SCRIPT', 'DEBUG', 'SYNC']);
    await this.client.request([
      'EVAL',
      this.request.lua,
      "0",
      ",",
    ]);
  }

  get isFinished(): boolean {
    return false;
  }

  async step(): Promise<string> {
    const result = await this.client.request(['step']);
    return this.responseParser.toString(result);
  }

  async continue(): Promise<string> {
    const result = await this.client.request(['continue']);
    return this.responseParser.toString(result);
  }

  async abort(): Promise<string> {
    const result = await this.client.request(['abort']);
    return this.responseParser.toString(result);
  }

  async restart(): Promise<string> {
    const result = await this.client.request(['restart']);
    return this.responseParser.toString(result);
  }

  async whole(): Promise<Line[]> {
    const redisValue = await this.client.request(['whole']);
    return this.responseParser.toSourceCode(redisValue);
  }

  async listBreakpoints(): Promise<string> {
    const result = await this.client.request(['break']);
    return this.responseParser.toString(result);
  }

  async addBreakpoint(line: number): Promise<string> {
    const result = await this.client.request(['break', line.toString()]);
    return this.responseParser.toString(result);
  }

  async removeBreakpoint(line: number): Promise<string> {
    const result = await this.client.request(['break', '-' + line.toString()]);
    return this.responseParser.toString(result);
  }

  async print(variable?: string): Promise<Variable[]> {
    const cmd = ['print'];
    if (variable) {
      cmd.push(variable);
    }
    const result = await this.client.request(cmd);
    return this.responseParser.toVariables(result);
  }

  async trace(): Promise<string> {
    const result = await this.client.request(['trace']);
    return this.responseParser.toString(result);
  }

  async finish(result: string): Promise<void> {
    this.client.close();
  }

  on(event: "finished", listener: (response: string) => void): void {
  }
}
