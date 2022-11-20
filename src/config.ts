import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { assertTcpPortAvailable } from './utils/port';

type Config = {
  port: number;
  tunnels: [number, number][];
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
      const ports: [number, number] = [+parts[0], +parts[1]]
      for (const port of ports) {
        if (isNaN(port)) {
          throw new Error(`Error: invalid tunnels port`)
        }
      }
      return ports;
    })
  };

  for (const port of [config.port, ...config.tunnels.map(t => t[0])]) {
    await assertTcpPortAvailable(argv.p);
  }

  return config;
}

