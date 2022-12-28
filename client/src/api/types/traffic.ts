type RedisValue = null | string | number | Error | RedisValue[];

interface RedisResponse {
  plain: string;
  value: RedisValue;
}

export interface RedisRequest {
  plain: string;
  value: RedisValue;
  time: number;
  response: RedisResponse;
}
