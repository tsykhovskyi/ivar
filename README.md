### Usage

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

#### Eval mode

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
