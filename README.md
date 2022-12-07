![debugger demo](https://github.com/tsykhovskyi/lua-debugger/blob/master/samples/debugger_demo.png)

### Installation

Install package globally if you want to use it separately of project

```
npm i -g @tsykhovskyi/lua-debugger
```

Or install as a dev dependency to enhance your development

```
npm i -D @tsykhovskyi/lua-debugger
```

### Usage

Start debugger in proxy mode. Set up forward traffic to redis port (default: 6379).

```
lua-debugger proxy --tunnel 6380:6379 --sync-mode
```

If debugger is installed as a project dependency next npm script can be defined

```json
{
  "scripts": {
    "redis:debugger": "npx lua-debugger proxy -t 6380:6379 --sync-mode"
  }
}
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

### Features

This application is a HTTP server that provide handy UI for Lua in Redis scripts debugging.
It can be launched in 2 modes:

- _proxy mode_: forwards commands to redis server and run script debugger on demand 
- _command mode_: Lua script file is executed with arguments

Debugger supports both `forked`(default) and `sync` redis debugging mode.

### Debugger CLI help

#### Debugger server

```
lua-debugger [command]

Commands:
  lua-debugger eval <file> <keys-and-args...>  send an EVAL command using the Lua script
                                               at <file>.
  lua-debugger proxy                           run tcp proxy and debug traffic

Options:
      --version    Show version number                                           [boolean]
  -p, --port       debugger server port                          [number] [default: 29999]
      --sync-mode  run debugger in sync mode                    [boolean] [default: false]
      --help       Show help                                                     [boolean]

Examples:
  lua-debugger --port 80    Start debugger UI on port 80
  lua-debugger --sync-mode  Start debugger in sync mode
  lua-debugger eval --help  Show eval command help
  lua-debugger tcp --help   Show tcp command help

```

#### Proxy mode

Allow to forward Redis port traffic and intercept required Lua scripts

```
lua-debugger proxy

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
  lua-debugger proxy --tunnel 6380:6379          Open proxy port with traffic forward and
  --filter <keyword>                             start debugger if <keyword> occurs
  lua-debugger proxy --t 6380:6379 --sync-mode   Start debug sessions in LDB sync mode
  lua-debugger proxy --tunnel 6380:6379          Disable traffic interception by default
  --disable

```

#### Command mode

Allow to debug single Lua script file

```
lua-debugger eval <file> <keys-and-args...>

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
  lua-debugger eval ./script.lua -P 6379      Debug local script file with redis on port
                                              6379
  lua-debugger eval ./script.lua key1 , arg1  Debug script with key and argument

```

### Examples

#### Proxy mode

Launch redis proxy with disabled debugging. It can be activated on UI.

```bash
lua-debugger proxy --tunnel 6380:6379 --disabled
```

Launch multiple redis proxies in sync mode. Sync/forked modes can be changed in UI.
Useful with cluster usage(TBD)

```bash
lua-debugger proxy --tunnel 63790:6379 --tunnel 63800:6380 --tunnel 63810:6381 --sync-mode
```

#### Command mode

Execute `~/scripts/test.lua` with a non-default redis port

```bash
lua-debugger eval ~/scripts/test.lua --redis-port 30000
```

Execute `~/scripts/test.lua` file in sync mode with keys (`key1`, `key2`) 
and arguments (`veni` `vidi` `vici`)

```bash
lua-debugger eval ~/scripts/test.lua key1 key2 , veni vidi vici --sync-mode
```
