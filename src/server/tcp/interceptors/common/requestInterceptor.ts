export interface InterceptResult {
  handled: boolean;
}

export interface RequestInterceptor {
  handle(request: string[]): boolean | Promise<boolean>;
}
