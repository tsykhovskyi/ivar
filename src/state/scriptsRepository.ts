class ScriptsRepository {
  private scriptsMap = new Map<string, string>();

  save(hash: string, script: string) {
    this.scriptsMap.set(hash, script);
  }

  get(hash: string): string | null {
    return this.scriptsMap.get(hash) ?? null;
  }
}

export const scriptsRepository = new ScriptsRepository();
