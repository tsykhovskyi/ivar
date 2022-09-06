import { Action, DebuggerInterface, Response } from "../debugger/debugger.interface";
import { Debugger } from "../debugger/debugger";
import { Connection } from "../ldb/connection";

let dbg: DebuggerInterface | null = null;

export function debugSessionStarted() {
  return dbg !== null;
}

export async function runDebugSession(args: string[]) {
  if (dbg !== null) {
    console.log('debug session already started. current session will be skipped...');
    return;
  }
  dbg = new Debugger(new Connection(args));
  await dbg.init();

  return new Promise((resolve, reject) => {
    if (dbg === null) {
      return reject();
    }
    dbg.on('finished', (result) => {
      resolve(result);
      dbg = null;
    });
  });
}

export async function execAction(action: Action, actionValue: string | null): Promise<Response> {
  if (!dbg) {
    throw new Error('Debugger is absent');
  }

  return dbg.execAction(action, actionValue ? [actionValue] : []);
}
