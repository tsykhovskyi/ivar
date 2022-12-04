export enum RespType {
  SimpleString = '+',
  Error = '-',
  Integer = ':',
  BulkString = '$',
  Array = '*',
}

export type RedisValue = null | string | number | Error | RedisValue[];
