import {
  Action,
  DebuggerState,
  ErrorResponse,
  FinishedResponse,
  Response,
  RunningResponse,
  SessionInterface
} from "./session.interface";
import { LuaDebuggerInterface, Variable } from "../ldb/lua-debugger-interface";
import EventEmitter from "events";
import { randomUUID } from "crypto";
import { RedisValue } from '../redis-client/resp-converter';

export class Session extends EventEmitter implements SessionInterface {
  id: string;
  state: DebuggerState = DebuggerState.Pending;
  result: FinishedResponse | ErrorResponse | null = null;

  watchVars: Set<string> = new Set();

  constructor(private luaDebugger: LuaDebuggerInterface, watch: string[] = []) {
    super();
    this.id = randomUUID();
    this.watchVars = new Set(watch);
    this.luaDebugger.on('finished', result => {
      this.result = { state: DebuggerState.Finished, result }
      this.changeState(DebuggerState.Finished);
      this.emit('finished', result);
    });
    this.luaDebugger.on('error', error => {
      this.result = { state: DebuggerState.Error, error };
      this.changeState(DebuggerState.Error);
      this.emit('error', error);
    });
  }

  async start(command: RedisValue) {
    await this.luaDebugger.start(command);
    this.changeState(DebuggerState.Running)
  }

  async finished(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.once('finished', (result) => resolve(result));
      this.once('error', (error) => reject(error));
    });
  }

  async execAction(action: Action | null, values: string[]): Promise<Response> {
    if (this.state === DebuggerState.Pending) {
      return { state: DebuggerState.Pending };
    }

    if (this.result !== null) {
      return this.result;
    }

    try {
      const cmdResponse = await this.handleAction(action, values);
      if (this.luaDebugger.isFinished) {
        this.result = { state: DebuggerState.Finished, result: cmdResponse };
        return this.result;
      }

      const sourceCode = await this.luaDebugger.whole();
      const variables = await this.luaDebugger.print();
      const trace = await this.luaDebugger.trace();
      const watch = await this.handleWatch();

      return <RunningResponse>{
        state: DebuggerState.Running,
        cmdResponse,
        sourceCode,
        watch,
        variables,
        trace,
      }
    } catch (error: any) {
      this.changeState(DebuggerState.Error);
      this.result = { state: DebuggerState.Error, error: error.toString() };
      return this.result;
    }
  }

  private async handleAction(action: Action | null, values: string[]): Promise<string[]> {
    switch (action) {
      case Action.None:
        return [];
      case Action.Step:
        return this.luaDebugger.step();
      case Action.Continue:
        return this.luaDebugger.continue();
      case Action.Abort:
        return this.luaDebugger.abort();
      case Action.Restart:
        return this.luaDebugger.restart();
      case Action.AddBreakpoint:
        return this.luaDebugger.addBreakpoint(Number(values[0]));
      case Action.RemoveBreakpoint:
        return this.luaDebugger.removeBreakpoint(Number(values[0]));
      case Action.AddWatch:
        this.watchVars.add(values[0].trim());
        return [];
      case Action.RemoveWatch:
        this.watchVars.delete(values[0].trim());
        return [];
    }
    throw new Error('Unsupported command');
  }

  private async handleWatch(): Promise<Variable[]> {
    const watch: Variable[] = [];
    for (const variable of this.watchVars) {
      const result = await this.luaDebugger.print(variable);
      watch.push({
        name: variable,
        value: result[0]?.value ?? null,
      })
    }
    return watch;
  }

  private changeState(state: DebuggerState) {
    this.state = state;
    this.emit('state-change', this.state);
  }
}
