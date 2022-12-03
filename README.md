#

Start up server npm run start

[post] `/start` start debug session
only 1 session can be active

[get] `/` - render debug window

[post] `/cmd` send command
```
{
  "action": "step" | "breakpoint",
  "value"?: number
}
```
Response
```json5
{
  "cmdResponse": "",
  "code": "", // source code
  "variables": "", // all vars
  "trace": "", // stack trace,
}
```

### TODO

- proxy connection error cases
- traffic filtering ui
- watch vars ui
- unified logger
