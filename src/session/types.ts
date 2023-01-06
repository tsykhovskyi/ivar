import { Line, Variable } from '../ldb/lua-debugger-interface';

export enum Action {
  None = '',
  Step = 'step',
  Continue = 'continue',
  Restart = 'restart',
  Abort = 'abort',
  AddBreakpoint = 'add-breakpoint',
  RemoveBreakpoint = 'remove-breakpoint',
  AddWatch = 'add-watch',
  RemoveWatch = 'remove-watch',
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
  cmdResponse: string[];
  sourceCode: Line[];
  watch: Variable[];
  variables: Variable[];
  trace: string[];
}

export interface FinishedResponse {
  state: DebuggerState.Finished;
  result: any;
}

export interface ErrorResponse {
  state: DebuggerState.Error;
  error: string;
}

export interface Timestamps {
  started: number;
  updated: number;
  finished?: number;
}

export type Response =
  | PendingResponse
  | RunningResponse
  | FinishedResponse
  | ErrorResponse;
