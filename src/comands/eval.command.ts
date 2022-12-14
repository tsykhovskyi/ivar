import { readContent } from '../utils/folder';
import { executeScript } from '../server/http/commands/executeScript';
import { ServerConfig } from './server.command';

export interface EvalConfig extends ServerConfig {
  file: string;
  'keys-and-args'?: string[];
  redisPort: number;
}

class EvalCommand {
  async handle(config: EvalConfig) {
    const lua = await readContent(config.file);
    const [numberOfKeys, args] = this.extractArgsWithKeysNumber(
      config['keys-and-args']
    );

    const result = await executeScript.handle({
      lua,
      redis: { host: 'localhost', port: config.redisPort },
      numberOfKeys,
      args,
    });

    if (result instanceof Error) {
      throw result;
    }

    return result;
  }

  private extractArgsWithKeysNumber(
    keysAndArgs?: string[]
  ): [number, string[]] {
    keysAndArgs = keysAndArgs ?? [];

    let commaPos = keysAndArgs.findIndex((v) => v === ',');
    commaPos = commaPos === -1 ? keysAndArgs.length : commaPos;

    keysAndArgs.splice(commaPos, 1);

    return [commaPos, keysAndArgs];
  }
}

export const evalCommand = new EvalCommand();
