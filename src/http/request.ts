import { saveContent } from "../utils/folder";

type Arg = string | number | boolean | null;

export interface LuaPlainRequest {
  redis: {host: string; port: number};
  lua: string;
  numberOfKeys: number;
  args: Arg[];
}

export async function luaRequestToDebugArgs(request: LuaPlainRequest): Promise<string[]> {
  const luaScriptPath = await saveContent(request.lua);

  return [
    'redis-cli',
    ...['-p', request.redis.port.toString()],
    '--ldb',
    ...['--eval', luaScriptPath],
    ...request.args.slice(0, request.numberOfKeys).map(toCliDebugArg), // Keys
    ',', // Separator
    ...request.args.slice(request.numberOfKeys).map(toCliDebugArg), // Args
  ];
}

function toCliDebugArg(arg: Arg): string {
  if (arg === null) {
    return '';
  }
  return arg.toString();
}
