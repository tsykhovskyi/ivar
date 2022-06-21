import { Debugger } from "../debugger/debugger";

let dbg: Debugger | null = null;
let sessionResponse: string | null = null;

export function debugSessionStarted() {
  return dbg !== null;
}

export async function runDebugSession(args: string[]) {
  if (dbg !== null) {
    console.log('debug session already started. current session will be skipped...');
    return;
  }
  dbg = new Debugger(args);
  sessionResponse = null;
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

enum Actions {
  Init = 'init',
  Step = 'step',
  Continue = 'continue',
  Restart = 'restart',
  Abort = 'abort',
  AddBreakpoint = 'add-breakpoint'
}

export async function execAction(action: Actions, actionValue: string | null): Promise<{
  cmdResponse: string,
  sourceCode?: string,
  variables?: string,
  trace?: string,
}> {
  if (!dbg) {
    throw new Error('LDB mode is off.');
  }

  let cmdResponse;
  switch (action) {
    case Actions.Step:
      cmdResponse = await dbg.step();
      break;
    case Actions.Continue:
      cmdResponse = await dbg.continue();
      break;
    case Actions.Abort:
      cmdResponse = await dbg.abort();
      break;
    case Actions.Restart:
      cmdResponse = await dbg.restart();
      break;
    case Actions.AddBreakpoint:
      cmdResponse = await dbg.addBreakpoint(actionValue !== null ? +actionValue : -1);
      break;
    default:
      cmdResponse = '';
  }

  if (dbg.isFinished) {
    // dbg.finish();
    return { cmdResponse };
  }

  const sourceCode = await dbg.whole();
  const variables = await dbg.print();
  const trace = await dbg.trace();

  return {
    cmdResponse,
    sourceCode,
    variables,
    trace,
  }
}
