import { readContent } from '../utils/folder';
import { executeScript } from '../server/http/commands/executeScript';
import { HttpServer } from '../server/http/httpServer';

export interface EvalConfig {
  port: number;
  file: string;
  keysAndArgs?: string[];
  redisPort: number;
}

class EvalCommand {
  async handle(config: EvalConfig) {
    const server = new HttpServer(config.port);
    server.run();

    const lua = await readContent(config.file);
    const [numberOfKeys, args] = this.extractArgsWithKeysNumber(config.keysAndArgs);

    const result = await executeScript.handle({
      lua,
      redis: { host: 'localhost', port: config.redisPort },
      numberOfKeys,
      args
    });

    return result;
  }

  private extractArgsWithKeysNumber(keysAndArgs?: string[]): [number, string[]] {
    keysAndArgs = keysAndArgs ?? [];

    let commaPos = keysAndArgs.findIndex(v => v === ',');
    commaPos = commaPos === -1 ? keysAndArgs.length : commaPos;

    keysAndArgs.splice(commaPos, 1);

    return [commaPos, keysAndArgs];
  }
}

export const evalCommand = new EvalCommand();
