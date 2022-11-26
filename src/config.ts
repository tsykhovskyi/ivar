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
    .recommendCommands()
    .help()
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
  };

  for (const port of [config.port, ...config.tunnels.map(t => t.src)]) {
    await assertTcpPortAvailable(argv.p);
  }

  return config;
}

