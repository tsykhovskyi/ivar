import { serverState } from '../serverState';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('./../../../../package.json');

export interface ConfigInterface {
  intercept: boolean;
  syncMode: boolean;
  scriptFilters: string[];
  server: {
    title: string
    version: string;
  }
}

class ConfigState {
  handle(): ConfigInterface {
    return {
      ...serverState.state,
      server: {
        title: packageJson.description,
        version: packageJson.version,
      }
    }
  }
}

export const configState = new ConfigState();
