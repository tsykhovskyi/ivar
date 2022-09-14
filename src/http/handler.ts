import { Action, DebuggerInterface, DebuggerState, Response } from "../debugger/debugger.interface";
import { Debugger } from "../debugger/debugger";
import { Connection } from "../ldb/connection";
import { randomUUID } from "crypto";

const sessionsPool: Map<string, DebuggerInterface> = new Map<string, DebuggerInterface>();

export function getSessions(): { id: string, state: DebuggerState }[] {
  return [...sessionsPool.entries()]
    .map(([id, debuggerSession]) => ({ id, state: debuggerSession.state }));
}

export async function runDebugSession(args: string[]) {
  const debuggerSession = new Debugger(new Connection(args));
  sessionsPool.set(debuggerSession.id, debuggerSession);
  await debuggerSession.init();

  return new Promise((resolve, reject) => {
    if (debuggerSession === null) {
      return reject();
    }
    debuggerSession.on('finished', (result) => {
      resolve(result);
      sessionsPool.delete(debuggerSession.id);
    });
  });
}

export async function execAction(action: Action, actionValue: string | null): Promise<Response> {
  const debuggerSession = [...sessionsPool.values()][0] ?? null;
  if (!debuggerSession) {
    throw new Error('Debugger is absent');
  }

  return debuggerSession.execAction(action, actionValue ? [actionValue] : []);
}
