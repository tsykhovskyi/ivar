export class RequestParser {
  isCommand(request: string[], ...args: string[]): request is string[] {
    if (!Array.isArray(request)) {
      return false;
    }

    for (let i = 0; i < args.length; i += 1) {
      if (
        typeof request[i] !== 'string' ||
        (request[i] as string).toLowerCase() !== args[i].toLowerCase()
      ) {
        return false;
      }
    }
    return true;
  }
}

export const requestParser = new RequestParser();
