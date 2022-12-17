export interface RequestInterceptor {
  /**
   * Return string of message response if was handled, otherwise - null
   */
  handle(request: string[]): Promise<string | null>;
}
