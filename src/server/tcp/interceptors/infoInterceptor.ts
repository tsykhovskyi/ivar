import { RequestInterceptor } from './common/requestInterceptor';
import { RedisClient } from '../../../redis-client/redis-client';
import { requestParser } from './common/requestParser';
import { RESP } from '../../../redis-client/resp';
import { proxyPortsReplacer } from './common/proxyPortsReplacer';
import { BulkString, isBulkString } from '../../../redis-client/resp/types';

export class InfoInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (!requestParser.isCommand(request, 'INFO')) {
      return null;
    }

    const infoResponse = await this.client.request(request);
    const message = await infoResponse.message();

    let info = RESP.decode(message);
    if (!isBulkString(info)) {
      return null;
    }

    info = new BulkString(
      info
        .split('\n')
        .map((line) => {
          if (line.startsWith('tcp_port') || line.startsWith('master_port')) {
            return proxyPortsReplacer.inPortLine(line);
          }
          return line;
        })
        .join('\n')
    );

    return RESP.encode(info);
  }
}
