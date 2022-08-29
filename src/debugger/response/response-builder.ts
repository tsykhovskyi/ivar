import { DebuggerState, FinishedResponse, PendingResponse, RunningResponse } from "../debugger.interface";

export const pendingResponse = (): PendingResponse => {
  return { state: DebuggerState.Pending };
}

export const finishedResponse = (result: any): FinishedResponse => {
  return { state: DebuggerState.Finished, result };
}

// export const runningResponse = (): RunningResponse => {
//   return {
//     state: DebuggerState.Running,
//     variables:
//   }
// }
