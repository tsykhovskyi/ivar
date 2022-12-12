import EventEmitter from 'events';

interface State {
  intercept: boolean;
  syncMode: boolean;
  scriptFilters: string[];
  tunnels: { src: number; dst: number }[];
}

class ServerState extends EventEmitter {
  state: State = {
    intercept: true,
    syncMode: false,
    scriptFilters: [],
    tunnels: [],
  };

  update(state: Partial<State>) {
    this.state = { ...this.state, ...state };
  }

  isDebuggerEnabled(): boolean {
    return this.state.intercept;
  }

  shouldInterceptScript(script: string) {
    if (!this.isDebuggerEnabled()) {
      return false;
    }

    if (this.state.scriptFilters.length === 0) {
      return true;
    }

    return (
      this.state.scriptFilters.findIndex((f) => script.indexOf(f) !== -1) !== -1
    );
  }
}

export const serverState = new ServerState();
