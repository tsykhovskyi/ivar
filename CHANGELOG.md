# ChangeLog

## [0.0.14] - 2022-02-27

### Fixed

- Save lua script eval even in debug disabled mode

## [0.0.13] - 2022-01-24

### Fixed

- UI debugger counter was not updated


## [0.0.12] - 2022-01-18

### Changed

- UI request responsiveness fix
- UI active tunnels & github button
- auto-save script in memory on `eval` command

### Fixed

- handle multichunk requests by proxy

## [0.0.11] - 2022-01-17

### Fixed

- handle multichunk requests by proxy

## [0.0.10] - 2022-01-11

### Changed

- three available modes for traffic requests: raw, pretty, grouped
- prevent fonts loading via network (only local files)
- traffic size per request

## [0.0.9] - 2022-01-10

### Changed

- Traffic proxy ports monitoring for both redis and debugger
- UI/UX improvements for traffic preview
- Removed raw preview for redis requests(UI)

### Fixed

- bugfix: interceptor string/bulk-string did not trigger

## [0.0.8] - 2022-01-09

### Changed

- request structure both RESP and plain style support
- `redis-cli --pipe` support
- pending request preview (UI)
- traffic "clear" button (UI)
- RESP protocol tests coverage

### Fixed

- binary safe data transfer
- debugger result fixed view
- UI bugfixes

## [0.0.7] - 2022-12-30

### Changed

- preview(redis-cli style) for request/response data structure

### Fixed

- show UI debug toolbar only on running session

## [0.0.6] - 2022-12-28

### Changed

- save `eval load` script in debugger memory instead of reject `evalsha` requests from client
- added debugger session finished result UI
- support for non-RESP requests
- proxy traffic monitoring, request/response preview 

## [0.0.5] - 2022-12-19

### Changed

- hide traffic in logs and mention only byte size and request payload

### Fixed

- fix debugger "restart" command hang up 

## [0.0.4] - 2022-12-17

### Changed

- Prevent skipping of nodes debugger ports by ports substitution in redis response 

### Fixed

- `Eval` mode throw exception on script fail
- Fixed redis message parsing in multiple TCP chunks

## [0.0.3] - 2022-12-12

### Changed

- Redis Cluster support
- Redis response parser logic abstracted from TCP chunks

## [0.0.2] - 2022-12-10

### Changed

- Enhance code style with _eslint_ and _prettier_

### Fixed

- Fix debugger is not responding when invalid script executed
