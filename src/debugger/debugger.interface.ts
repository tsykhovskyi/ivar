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
  sourceCode: any;
  watch: any;
  variables: any;
  trace: any;
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
  init(): Promise<void>;

  execAction(action: Action | null, values: string[]): Promise<Response>;
}
