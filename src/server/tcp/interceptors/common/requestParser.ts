export class RequestParser {
  isCommand(request: string[], ...args: string[]): request is string[] {
    if (
      !Array.isArray(request) ||
      !request.every((v) => typeof v === 'string')
    ) {
      return false;
    }

    for (let i = 0; i < args.length; i += 1) {
      if ((request[i] as string).toLowerCase() !== args[i].toLowerCase()) {
        return false;
      }
    }
    return true;
  }
}

export const requestParser = new RequestParser();
