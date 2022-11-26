import yargs, { number } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { assertTcpPortAvailable } from './utils/port';

export type Tunnel = {
  src: number;
  dst: number;
}

export type Config = {
  port: number;
  tunnels: Tunnel[];
  filters: string[];
  eval: string | null;
}

export const parseArgs = async (): Promise<Config> => {
  const argv = await yargs(hideBin(process.argv))
    .option('p', {
      alias: 'port',
      default: 29999,
      number: true,
      describe: 'debugger application port'
    })
    .option('t', {
      alias: 'tunnel',
      array: true,
      string: true,
      describe: 'redis port paths map',
    })
    .option('f', {
      alias: 'filter',
      array: true,
      string: true,
      describe: 'debug scripts that match filter'
    })
    .option('eval', {
      string: true,
      describe: 'send an EVAL command using the Lua script at <file>.'
    })
    .recommendCommands()
    .help()
    .example([
      ['$0 --eval ./scripts/test.lua', "Debug local script file"],
      ['$0 --tunnel 6380:6379 --filter <keyword>', "Open proxy port with traffic forward and start debugger if <keyword> occurs"],
      ['$0 --port 29999', "Start debugger UI on port 29999"],
    ])
    .wrap(120)
    .parse();

  const config: Config = {
    port: argv.p,
    tunnels: (argv.t ?? []).map(tunnelStr => {
      const parts = tunnelStr.split(':');
      if (parts.length !== 2) {
        throw new Error('Error: invalid proxy path')
      }
      const tunnel: Tunnel = {src: +parts[0], dst: +parts[1]};
      if (isNaN(tunnel.src) || isNaN(tunnel.dst)) {
        throw new Error(`Error: invalid tunnels port`)
      }
      return tunnel;
    }),
    filters: argv.f ?? [],
    eval: (() => {
      if (!argv.eval) {
        return null;
      }
      return argv.eval;
    })(),
  };

  for (const port of [config.port, ...config.tunnels.map(t => t.src)]) {
    await assertTcpPortAvailable(argv.p);
  }

  return config;
}

