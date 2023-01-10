export type RedisValue = null | string | number | RedisValue[];

interface RedisResponse {
  plain: string;
  value: string[];
}

export interface RedisRequest {
  id: string;
  plain: string;
  value: string[];
  time: number;
  response: RedisResponse;
  proxy: { src: number; dst: number };
}
