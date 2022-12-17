import { RequestInterceptor } from './requestInterceptor';

export class InterceptorChain implements RequestInterceptor {
  constructor(private interceptors: RequestInterceptor[]) {}

  async handle(request: string[]): Promise<boolean> {
    for (const requestHandler of this.interceptors) {
      if (await requestHandler.handle(request as string[])) {
        return true;
      }
    }
    return false;
  }
}
