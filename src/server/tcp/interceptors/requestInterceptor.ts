export interface RequestInterceptor {
  handle(request: string[]): boolean | Promise<boolean>;
}
