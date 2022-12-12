# IVAR - Lua in Redis debugger and monitoring tool

![debugger demo](https://github.com/tsykhovskyi/ivar/blob/master/samples/debugger_demo.png)

## Installation

Install package globally if you want to use it separately of project

```
npm i -g @tsykhovskyi/ivar
```

Or install as a dev dependency to enhance your development

```
npm i -D @tsykhovskyi/ivar
```

## Usage

Start debugger in proxy mode. Set up forward traffic to redis port (default: 6379).

```
ivar proxy --tunnel 6380:6379 --sync-mode
```

If debugger is installed as a project dependency next npm script can be defined

```
npx ivar proxy -t 6380:6379 --sync-mode
```

Then run from project root

```bash
npm run redis:debugger
```

Debugger opens additional redis port(`6380`) and will forward all traffic from it to the main
redis server. By default, debugger is enabled so it will run debug process on each
`EVAL` command.

Let's try with simple example

```bash
# Login with redis-cli REPL to debugger proxy port
redis-cli -p 6380

# Run script
EVAL "local msg = ARGV[1] .. ARGV[2];\n return msg" 0 "Hello" "world"
```

Console is halted now and debug window can be opened at http://127.0.0.1:29999. After script
execution is finished console will return its result.

## Features

This application is a HTTP server that provide handy UI for Lua in Redis scripts debugging.
Two modes are available for debugging:

- _proxy mode_: forwards commands to redis server and run script debugger on demand
- _command mode_: Lua script file is executed with arguments

In proxy mode debugger you can use debugger ports as redis for your application. If Redis is
set up in Cluster mode, then for better experience and debug coverage you should forward ports 
for all nodes.


Debugger supports both Redis `forked`(default) and `sync` redis debugging mode. It can be changed
in UI and predefined with `--sync-mode` option. https://redis.io/docs/manual/programmability/lua-debugging/#synchronous-mode

### Debugger UI features
- Step (F8)
- Continue (F9)
- Abort/Restart execution
- Breakpoints
- Scope/Watch variables
- Multiple debug session simultaneously

## Debugger CLI help

### Debugger server

```
ivar [command]

Commands:
  ivar eval <file> <keys-and-args...>  send an EVAL command using the Lua script
                                               at <file>.
  ivar proxy                           run tcp proxy and debug traffic

Options:
      --version    Show version number                                           [boolean]
  -p, --port       debugger server port                          [number] [default: 29999]
      --sync-mode  run debugger in sync mode                    [boolean] [default: false]
      --help       Show help                                                     [boolean]

Examples:
  ivar --port 80    Start debugger UI on port 80
  ivar --sync-mode  Start debugger in sync mode
  ivar eval --help  Show eval command help
  ivar tcp --help   Show tcp command help

```

### Proxy mode

Allow to forward Redis port traffic and intercept required Lua scripts

```
ivar proxy

run tcp proxy and debug traffic

Options:
      --version    Show version number                                           [boolean]
  -p, --port       debugger server port                          [number] [default: 29999]
      --sync-mode  run debugger in sync mode                    [boolean] [default: false]
      --help       Show help                                                     [boolean]
  -t, --tunnel     redis port paths map                                 [array] [required]
  -f, --filter     debug scripts that match filter                                 [array]
      --disable    disable debugger on start                    [boolean] [default: false]

Examples:
  ivar proxy --tunnel 6380:6379          Open proxy port with traffic forward and
  --filter <keyword>                             start debugger if <keyword> occurs
  ivar proxy --t 6380:6379 --sync-mode   Start debug sessions in LDB sync mode
  ivar proxy --tunnel 6380:6379          Disable traffic interception by default
  --disable

```

### Command mode

Allow to debug single Lua script file

```
ivar eval <file> <keys-and-args...>

send an EVAL command using the Lua script at <file>.

Positionals:
  file           lua file path                                         [string] [required]
  keys-and-args  comma separated keys and args            [array] [required] [default: []]

Options:
      --version     Show version number                                          [boolean]
  -p, --port        debugger server port                         [number] [default: 29999]
      --sync-mode   run debugger in sync mode                   [boolean] [default: false]
      --help        Show help                                                    [boolean]
  -P, --redis-port  redis server port                  [number] [required] [default: 6379]

Examples:
  ivar eval ./script.lua -P 6379      Debug local script file with redis on port
                                              6379
  ivar eval ./script.lua key1 , arg1  Debug script with key and argument

```

## Examples

### Proxy mode

Launch redis proxy with disabled debugging. It can be activated on UI.

```bash
ivar proxy --tunnel 6380:6379 --disabled
```

Launch multiple redis proxies in sync mode. Sync/forked modes can be changed in UI.
In cluster mode it is recommended to forward all redis node ports.

```bash
ivar proxy --tunnel 63790:6379 --tunnel 63800:6380 --tunnel 63810:6381 --sync-mode
```

#### Command mode

Execute `~/scripts/test.lua` with a non-default redis port

```bash
ivar eval ~/scripts/test.lua --redis-port 30000
```

Execute `~/scripts/test.lua` file in sync mode with keys (`key1`, `key2`)
and arguments (`veni` `vidi` `vici`)

```bash
ivar eval ~/scripts/test.lua key1 key2 , veni vidi vici --sync-mode
```
