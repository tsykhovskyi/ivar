import EventEmitter from 'events';

interface Tunnel {
  src: number;
  dst: number;
}

interface State {
  intercept: boolean;
  syncMode: boolean;
  flushOnMiss: boolean;
  scriptFilters: string[];
  tunnels: Tunnel[];
}

class ServerState extends EventEmitter {
  state: State = {
    intercept: true,
    flushOnMiss: false,
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

  getTunnels(): Tunnel[] {
    return this.state.tunnels;
  }

  shouldInterceptScript(script?: string) {
    if (!script) {
      return false;
    }

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
