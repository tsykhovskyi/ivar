import { Commander } from "./commander";
import EventEmitter from "events";
import { processSourceCode } from "./response/source-code";
import { consoleContentToHtml } from "./response/common";
import { processVariables } from "./response/variables";
import { ConnectionInterface, Line, Variable } from "./connection-interface";

export class Connection extends EventEmitter implements ConnectionInterface {
  private cmd: Commander;

  constructor(args: string[]) {
    super();
    this.cmd = new Commander(args);
  }

  isFinished: boolean = false;

  init = async () => {
    this.cmd.on('close', () => this.emit('close'));

    await this.cmd.init();
    await this.maxlen(0);
  }

  async finish(result: string) {
    this.isFinished = true;
    this.emit('finished', result);
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

  private async rawCmd(cmd: string) {
    const result = await this.runCmdRequest(cmd);

    return consoleContentToHtml(result);
  }

  private async runCmdRequest(request: string): Promise<string> {
    if (this.isFinished) {
      throw new Error('LDB session ended');
    }
    const result = await this.cmd.request(request);
    await this.checkForError(result);
    return result;
  }

  private async checkForError(result: string) {
    if (result.trim().startsWith('(error) ')) {
      await this.finish(result);
      throw new Error(result);
    }
  }

  private async checkForResult(result: string) {
    if (!result.trim().startsWith('(')) {
      return;
    }

    await this.finish(result);
  }
}
