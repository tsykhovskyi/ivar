export enum DebuggerState {
  Pending = 'pending',
  Running = 'running',
  Finished = 'finished',
  Error = 'error',
}

export interface Session {
  id: string;
  state: DebuggerState;
  time: {
    started: number;
    updated: number;
    finished?: number;
  };
}

export interface Line {
  content: string;
  number: number;
  isCurrent: boolean;
  isBreakpoint: boolean;
}

export interface RunningResponse {
  id: string;
  state: DebuggerState.Running;
  cmdResponse: string[];
  sourceCode: Line[];
  watch: {
    name: string;
    value: string | null;
  }[];
  variables: {
    name: string;
    value: string;
  }[];
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

export type DebuggerResponse =
  | { state: DebuggerState }
  | RunningResponse
  | FinishedResponse
  | ErrorResponse;
