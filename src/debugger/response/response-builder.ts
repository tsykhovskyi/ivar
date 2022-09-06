import {
  DebuggerState,
  ErrorResponse,
  FinishedResponse,
  PendingResponse,
} from "../debugger.interface";

export const pendingResponse = (): PendingResponse => {
  return { state: DebuggerState.Pending };
}

export const errorResponse = (error: string): ErrorResponse => {
  return { state: DebuggerState.Error, error };
}

export const finishedResponse = (result: any): FinishedResponse => {
  return { state: DebuggerState.Finished, result };
}
