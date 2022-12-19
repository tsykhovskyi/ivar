# ChangeLog

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
