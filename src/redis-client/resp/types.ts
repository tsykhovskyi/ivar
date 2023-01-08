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

export const isArrayOfBulkStrings = (
  value: RedisValue
): value is BulkString[] =>
  Array.isArray(value) && value.every((v) => v instanceof BulkString);
