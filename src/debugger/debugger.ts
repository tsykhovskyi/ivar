import {
  Action,
  DebuggerInterface,
  DebuggerState,
  ErrorResponse,
  FinishedResponse,
  Response, RunningResponse
} from "./debugger.interface";
import { ConnectionInterface } from "../ldb/connection-interface";
import EventEmitter from "events";
import { randomUUID } from "crypto";


export class Debugger extends EventEmitter implements DebuggerInterface {
  id: string;
  state: DebuggerState = DebuggerState.Pending;
  result: FinishedResponse | ErrorResponse | null = null;

  constructor(private connection: ConnectionInterface) {
    super();
    this.id = randomUUID();
    this.connection.on('finished', result => this.emit('finished', result));
  }

  async init() {
    await this.connection.init();
    this.state = DebuggerState.Running;
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
      if (this.connection.isFinished) {
        return this.result = { state: DebuggerState.Finished, result: cmdResponse };
      }

      const sourceCode = await this.connection.whole();
      const variables = await this.connection.print();
      const trace = await this.connection.trace();

      return <RunningResponse>{
        state: DebuggerState.Running,
        cmdResponse,
        sourceCode,
        watch: [],
        variables,
        trace,
      }
    } catch (error: any) {
      return this.result = { state: DebuggerState.Error, error: error.toString() };
    }
  }

  private async handleAction(action: Action | null, values: string[]) {
    switch (action) {
      case Action.Step:
        return this.connection.step();
      case Action.Continue:
        return this.connection.continue();
      case Action.Abort:
        return this.connection.abort();
      case Action.Restart:
        return this.connection.restart();
      case Action.AddBreakpoint:
        return this.connection.addBreakpoint(Number(values[0]));
      case Action.RemoveBreakpoint:
        return this.connection.removeBreakpoint(Number(values[0]));
    }
    return Promise.resolve(null);
  }
}
