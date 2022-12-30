export type RedisValue = null | string | number | RedisValue[];

interface RedisResponse {
  plain: string;
  value: string[];
}

export interface RedisRequest {
  plain: string;
  value: string[];
  time: number;
  response: RedisResponse;
}
