import { RequestInterceptor } from './common/requestInterceptor';
import { RedisClient } from '../../../redis-client/redis-client';
import { proxyPortsReplacer } from './common/proxyPortsReplacer';

export class PassInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  /**
   * The last interceptor that always should pass through redis request
   */
  async handle(request: string[]): Promise<string> {
    const response = await this.client.request(request);
    let message = await response.message();

    message = this.handleClusterKeyMoved(message);

    return message;
  }

  private handleClusterKeyMoved(message: string): string {
    if (!message.startsWith('-MOVED ')) {
      return message;
    }
    return proxyPortsReplacer.inIpPortLine(message);
  }
}
