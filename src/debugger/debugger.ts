import { Connection } from "../ldb/connection";
import {
  Action,
  DebuggerInterface,
  DebuggerState,
  ErrorResponse,
  FinishedResponse,
  Response
} from "./debugger.interface";
import { pendingResponse } from "./response/response-builder";


export class Debugger implements DebuggerInterface {
  state: DebuggerState = DebuggerState.Pending;
  result: FinishedResponse | ErrorResponse | null = null;

  constructor(private connection: Connection) {
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

    const cmdResponse = await this.handleAction(action, values);
    const sourceCode = await this.connection.whole();
    const variables = await this.connection.print();
    const trace = await this.connection.trace();

    return {
      state: DebuggerState.Running,
      cmdResponse,
      watch: null,
      sourceCode,
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
