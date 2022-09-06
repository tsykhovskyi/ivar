import {
  Action,
  DebuggerInterface,
  DebuggerState,
  ErrorResponse,
  FinishedResponse,
  Response, RunningResponse
} from "./debugger.interface";
import { errorResponse, finishedResponse, pendingResponse } from "./response/response-builder";
import { ConnectionInterface } from "../ldb/connection-interface";
import EventEmitter from "events";


export class Debugger extends EventEmitter implements DebuggerInterface {
  state: DebuggerState = DebuggerState.Pending;
  result: FinishedResponse | ErrorResponse | null = null;

  constructor(private connection: ConnectionInterface) {
    super();
    this.connection.on('finished', result => this.emit('finished', result));
  }

  async init() {
    await this.connection.init();
    this.state = DebuggerState.Running;
  }

  async execAction(action: Action | null, values: string[]): Promise<Response> {
    if (this.state === DebuggerState.Pending) {
      return pendingResponse();
    }

    if (this.result !== null) {
      return this.result;
    }

    try {
      const cmdResponse = await this.handleAction(action, values);
      if (this.connection.isFinished) {
        return this.result = finishedResponse(cmdResponse);
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
      return this.result = errorResponse(error.toString());
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
        return this.connection.addBreakpoint(values[0] !== null ? +values[0] : -1);
    }
    return Promise.resolve(null);
  }
}
