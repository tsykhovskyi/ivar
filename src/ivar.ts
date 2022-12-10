#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { evalCommand } from './comands/eval.command';
import { proxyCommand } from './comands/proxy.command';
import { serverCommand } from './comands/server.command';

(async () => {
  yargs(hideBin(process.argv))
    .option('port', {
      alias: 'p',
      default: 29999, // todo check 0 port
      type: 'number',
      description: 'debugger server port',
    })
    .option('sync-mode', {
      default: false,
      type: 'boolean',
      description: 'run debugger in sync mode',
    })
    .middleware((args) => {
      serverCommand.handle(args);
    })
    .command(
      'eval <file> <keys-and-args...>',
      'send an EVAL command using the Lua script at <file>.',
      (yargs) =>
        yargs
          .positional('file', {
            description: 'lua file path',
            type: 'string',
            demandOption: true,
          })
          .positional('keys-and-args', {
            description: 'comma separated keys and args',
            type: 'string',
            array: true,
          })
          .option('redis-port', {
            alias: 'P',
            description: 'redis server port',
            type: 'number',
            default: 6379,
            demandOption: true,
          })
          .example([
            [
              '$0 eval ./script.lua -P 6379',
              'Debug local script file with redis on port 6379',
            ],
            [
              '$0 eval ./script.lua key1 , arg1',
              'Debug script with key and argument',
            ],
          ]),
      async (args) => {
        const result = await evalCommand.handle(args);
        console.log('Script finished with result\n');
        console.log(JSON.stringify(result));
        process.exit(0);
      }
    )
    .command(
      'proxy',
      'run tcp proxy and debug traffic',
      (yargs) =>
        yargs
          .option('tunnel', {
            alias: 't',
            type: 'string',
            array: true,
            describe: 'redis port paths map',
          })
          .option('filter', {
            alias: 'f',
            type: 'string',
            array: true,
            describe: 'debug scripts that match filter',
          })
          .option('disable', {
            default: false,
            type: 'boolean',
            description: 'disable debugger on start',
          })
          .demandOption(['tunnel'], 'At least one tunnel should be defined')
          .example([
            [
              '$0 proxy --tunnel 6380:6379 --filter <keyword>',
              'Open proxy port with traffic forward and start debugger if <keyword> occurs',
            ],
            [
              '$0 proxy --t 6380:6379 --sync-mode',
              'Start debug sessions in LDB sync mode',
            ],
            [
              '$0 proxy --tunnel 6380:6379 --disable',
              'Disable traffic interception by default',
            ],
          ]),
      (args) => proxyCommand.handle(args)
    )
    .recommendCommands()
    .help()
    .example([
      ['$0 --port 80', 'Start debugger UI on port 80'],
      ['$0 --sync-mode', 'Start debugger in sync mode'],
      ['$0 eval --help', 'Show eval command help'],
      ['$0 tcp --help', 'Show tcp command help'],
    ])
    .wrap(90)
    .recommendCommands()
    .showHelpOnFail(true)
    .scriptName('ivar').argv;

  process.on('uncaughtException', function (err) {
    console.error('UNCAUGHT EXCEPTION:', err);
  });
})();
