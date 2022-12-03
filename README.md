### Usage

#### Debugger server

```
lua-debugger [command]

Commands:
  lua-debugger eval <file> <keys-and-args...>  send an EVAL command using the Lua script
                                               at <file>.
  lua-debugger proxy                           run tcp proxy and debug traffic

Options:
      --version  Show version number                                             [boolean]
  -p, --port     debugger server port                            [number] [default: 29999]
      --help     Show help                                                       [boolean]

Examples:
  lua-debugger --port 29999  Start debugger UI on port 29999
  lua-debugger eval --help   Show eval command help
  lua-debugger tcp --help    Show tcp command help

```

#### Proxy mode

Allow to forward Redis port traffic and intercept required Lua scripts

```
lua-debugger proxy

run tcp proxy and debug traffic

Options:
      --version    Show version number                                           [boolean]
  -p, --port       debugger server port                          [number] [default: 29999]
      --help       Show help                                                     [boolean]
  -t, --tunnel     redis port paths map                                 [array] [required]
  -f, --filter     debug scripts that match filter                                 [array]
      --disable    disable debugger on start                    [boolean] [default: false]
      --sync-mode  run debugger in sync mode                    [boolean] [default: false]

Examples:
  lua-debugger proxy --tunnel 6380:6379          Open proxy port with traffic forward and
  --filter <keyword>                             start debugger if <keyword> occurs
  lua-debugger proxy --tunnel 6380:6379          Start debug sessions in LDB sync mode
  --sync-mode
  lua-debugger proxy --tunnel 6380:6379          Disable traffic interception by default
  --disable

```

#### Eval mode

Allows to debug single Lua script file

```
lua-debugger eval <file> <keys-and-args...>

send an EVAL command using the Lua script at <file>.

Positionals:
  file           lua file path                                         [string] [required]
  keys-and-args  comma separated keys and args            [array] [required] [default: []]

Options:
      --version     Show version number                                          [boolean]
  -p, --port        debugger server port                         [number] [default: 29999]
      --help        Show help                                                    [boolean]
  -P, --redis-port  redis server port                  [number] [required] [default: 6379]

Examples:
  lua-debugger eval ./scripts.lua                Debug local script file
  lua-debugger eval ./scripts.lua key1 key2 ,    Debug local script file with parameters

```

### TODO

- proxy connection error cases
- traffic filtering ui
- unified logger
