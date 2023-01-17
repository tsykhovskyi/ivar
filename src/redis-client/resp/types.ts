export enum RespType {
  SimpleString = '+',
  Error = '-',
  Integer = ':',
  BulkString = '$',
  Array = '*',
}

export class BulkString extends String {}

export type RedisRequest = Array<string | BulkString>;

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

export const isString = (value?: RedisValue): value is string =>
  typeof value === 'string';
export const isBulkString = (value?: RedisValue): value is BulkString =>
  value instanceof BulkString;
export const isStringable = (
  value?: RedisValue
): value is string | BulkString => isString(value) || isBulkString(value);
