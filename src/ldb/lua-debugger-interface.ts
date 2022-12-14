/**
 * Redis Lua debugger help:
 * [h]elp               Show this help.
 * [s]tep               Run current line and stop again.
 * [n]ext               Alias for step.
 * [c]continue          Run till next breakpoint.
 * [l]list              List source code around current line.
 * [l]list [line]       List source code around [line].
 *                      line = 0 means: current position.
 * [l]list [line] [ctx] In this form [ctx] specifies how many lines
 *                      to show before/after [line].
 * [w]hole              List all source code. Alias for 'list 1 1000000'.
 * [p]rint              Show all the local variables.
 * [p]rint <var>        Show the value of the specified variable.
 *                      Can also show global vars KEYS and ARGV.
 * [b]reak              Show all breakpoints.
 * [b]reak <line>       Add a breakpoint to the specified line.
 * [b]reak -<line>      Remove breakpoint from the specified line.
 * [b]reak 0            Remove all breakpoints.
 * [t]race              Show a backtrace.
 * [e]eval <code>       Execute some Lua code (in a different callframe).
 * [r]edis <cmd>        Execute a Redis command.
 * [m]axlen [len]       Trim logged Redis replies and Lua var dumps to len.
 *                      Specifying zero as <len> means unlimited.
 * [a]bort              Stop the execution of the script. In sync
 *                      mode dataset changes will be retained.
 *
 * Debugger functions you can call from Lua scripts:
 * redis.debug()        Produce logs in the debugger console.
 * redis.breakpoint()   Stop execution like if there was a breakpoint in the
 *                      next line of code.
 */
import { RedisValue } from '../redis-client/resp';

export interface Line {
  content: string;
  number: number;
  isCurrent: boolean;
  isBreakpoint: boolean;
}

export interface Variable {
  name: string;
  value: string | null;
}

/**
 * Abstraction with data structure mapping for Lua debugger API
 */
export interface LuaDebuggerInterface {
  start(): Promise<RedisValue>;

  whole(): Promise<Line[]>;

  step(): Promise<string[]>;

  continue(): Promise<string[]>;

  restart(): Promise<string[]>;

  abort(): Promise<string[]>;

  trace(): Promise<string[]>;

  print(variable?: string): Promise<Variable[]>;

  listBreakpoints(): Promise<string[]>;

  addBreakpoint(line: number): Promise<string[]>;

  removeBreakpoint(line: number): Promise<string[]>;

  on(event: 'finished', listener: (response: string) => void): void;

  on(event: 'error', listener: (error: any) => void): void;
}
