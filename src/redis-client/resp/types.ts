export enum RespType {
  SimpleString = '+',
  Error = '-',
  Integer = ':',
  BulkString = '$',
  Array = '*',
}

export class BulkString extends String {}

export type RedisValue =
  | null
  | string
  | BulkString
  | number
  | Error
  | RedisValue[];
