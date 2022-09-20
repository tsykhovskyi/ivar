import { Session } from "../session/session";
import { TcpClientDebugger } from "../ldb/tcp/tcp-client-debugger";
import { Action, DebuggerState, Response, SessionInterface } from "../session/session.interface";
import { LuaPlainRequest } from "../ldb/lua-debugger-interface";

const sessionsPool: Map<string, SessionInterface> = new Map<string, SessionInterface>();

export function getSessions(): { id: string, state: DebuggerState }[] {
  return [...sessionsPool.entries()]
    .map(([id, debuggerSession]) => ({ id, state: debuggerSession.state }));
}

export async function runDebugSession(request: LuaPlainRequest) {
  const debuggerSession = new Session(new TcpClientDebugger(request));
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
