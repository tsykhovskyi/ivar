import { Line, Variable } from "../ldb/connection-interface";

export enum Action {
  Step = 'step',
  Continue = 'continue',
  Restart = 'restart',
  Abort = 'abort',
  AddBreakpoint = 'add-breakpoint'
}

export enum DebuggerState {
  Pending = 'pending',
  Running = 'running',
  Finished = 'finished',
  Error = 'error',
}

export interface PendingResponse {
  state: DebuggerState.Pending;
}

export interface RunningResponse {
  state: DebuggerState.Running;
  cmdResponse: string;
  sourceCode: Line[];
  watch: Variable[];
  variables: Variable[];
  trace: string;
}

export interface FinishedResponse {
  state: DebuggerState.Finished;
  result: any;
}

export interface ErrorResponse {
  state: DebuggerState.Error;
  error: string;
}

export type Response = PendingResponse | RunningResponse | FinishedResponse | ErrorResponse;

export interface DebuggerInterface {
  readonly id: string
  readonly state: DebuggerState;

  init(): Promise<void>;

  execAction(action: Action | null, values: string[]): Promise<Response>;

  on(event: 'finished', listener: (response: string) => void): void;
}
