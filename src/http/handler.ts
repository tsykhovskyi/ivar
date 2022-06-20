import { Debugger } from "../debugger/debugger";

let dbg: Debugger | null = null;

export function debugSessionStarted() {
  return dbg !== null;
}

export async function runDebugSession(args: string[]) {
  if (dbg !== null) {
    console.log('debug session already started. current session will be skipped...');
    return;
  }
  dbg = new Debugger(args);
  await dbg.init();

  await new Promise(resolve => dbg?.on('close', resolve));
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
  sourceCode: string | null,
  variables: string | null,
  trace: string | null,
}> {
  if (!dbg) {
    throw new Error('debug session missing');
  }
  if (!await dbg.isLDB()) {
    dbg.close()
    dbg = null;
    throw new Error('LDB mode is off.');
  }

  let cmdResponse = '';
  switch (action) {
    case Actions.Init:
      break;
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
      throw new Error('Unrecognized action: ' + action);
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
