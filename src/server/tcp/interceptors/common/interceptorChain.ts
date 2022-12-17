import { RequestInterceptor } from './requestInterceptor';

export class InterceptorChain implements RequestInterceptor {
  constructor(private interceptors: RequestInterceptor[]) {}

  async handle(request: string[]): Promise<string | null> {
    for (const requestHandler of this.interceptors) {
      const response = await requestHandler.handle(request as string[]);
      if (response !== null) {
        return response;
      }
    }
    return null;
  }
}
