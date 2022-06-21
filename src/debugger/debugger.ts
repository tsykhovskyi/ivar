import { Command } from "./command";
import EventEmitter from "events";
import { parseLuaResult } from "./result-parser";

export class Debugger extends EventEmitter {
  private cmd: Command;
  public response: string | null = null;

  constructor(args: string[]) {
    super();
    this.cmd = new Command(args);
  }

  get isFinished() {
    return this.response !== null;
  }

  init = async () => {
    this.cmd.on('close', () => this.emit('close'));

    await this.cmd.init();
    await this.maxlen(0);
  }

  finish() {
    this.emit('finished', this.response);
    this.cmd.close();
  }

  /**
   * Check if command is in Lua debugger mode
   */
  isLDB = async () => {
    // lua script evaluation is possible only in lua debugger
    try {
      const res = await this.runCmdRequest('e 1');
      return res === '\x1b[0;35;49m<retval> 1\x1b[0m\n'
    } catch (err) {
      return false;
    }
  }

  /**
   * This service follows official Lua debugger API:
   *
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
  step = () => this.runCmdRequest('step');
  whole = () => this.runCmdRequest('whole');
  continue = () => this.runCmdRequest('continue');
  restart = () => this.runCmdRequest('restart');
  abort = () => this.runCmdRequest('abort');
  trace = () => this.runCmdRequest('trace');
  print = (variable?: string) => this.runCmdRequest(`print ${variable ? variable : ''}`);
  listBreakpoints = () => this.runCmdRequest('break');
  addBreakpoint = (line: number) => this.runCmdRequest(`break ${line}`);
  removeBreakpoint = (line: number) => this.runCmdRequest(`break -${line}`);
  maxlen = (len: number) => this.runCmdRequest(`maxlen ${len}`);

  async runCmdRequest(request: string): Promise<string> {
    const result = await this.cmd.request(request);
    if (['step', 'continue', 'restart', 'abort'].includes(request)) {
      if (!await this.isLDB()) {
        this.response = parseLuaResult(result);
        this.finish();
      }
    }

    return result;
  }
}
