import { Commander } from "./commander";
import EventEmitter from "events";
import { Line, processSourceCode } from "./response/source-code";
import { consoleContentToHtml } from "./response/common";
import { processVariables, Variable } from "./response/variables";

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
export class Connection extends EventEmitter {
  private cmd: Commander;
  public response: string | null = null;

  constructor(args: string[]) {
    super();
    this.cmd = new Commander(args);
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
    try {
      const res = await this.runCmdRequest('e 1');
      return res === '\x1b[0;35;49m<retval> 1\x1b[0m\n'
    } catch (err) {
      return false;
    }
  }

  async whole(): Promise<Line[]> {
    const result = await this.runCmdRequest('whole');

    return processSourceCode(result);
  }
  step = () => this.stepperCmd('step');
  continue = () => this.stepperCmd('continue');
  restart = () => this.stepperCmd('restart');
  abort = () => this.stepperCmd('abort');
  trace = () => this.runCmdRequest('trace');
  async print(variable?: string): Promise<Variable[]> {
    const result = await this.runCmdRequest(`print ${variable ? variable : ''}`);

    return processVariables(result);
  }
  listBreakpoints = () => this.rawCmd('break');
  addBreakpoint = (line: number) => this.rawCmd(`break ${line}`);
  removeBreakpoint = (line: number) => this.rawCmd(`break -${line}`);
  maxlen = (len: number) => this.rawCmd(`maxlen ${len}`);

  private async stepperCmd(cmd: 'abort' | 'step' | 'restart' | 'continue') {
    const result = await this.runCmdRequest(cmd);

    this.checkForResult(result);

    return consoleContentToHtml(result);
  }

  private async rawCmd(cmd: string): Promise<string> {
    const result = await this.runCmdRequest(cmd);

    return consoleContentToHtml(result);
  }

  private async runCmdRequest(request: string): Promise<string> {
    const result = await this.cmd.request(request);
    this.checkForError(result);
    return result;
  }

  private checkForError(result: string) {
    if (result.trim().startsWith('(error) ')) {
      throw new Error(result);
    }
  }

  private checkForResult(result: string) {
    if (!result.trim().startsWith('(')) {
      return;
    }
    this.response = result;
  }
}
