export default abstract class Common {
  static #fetch?: typeof import('node-fetch');

  public static sanitize(content: string): string {
    return content.replace(/([_*\\|`])/g, '\\$1');
  }

  /**
   * Returns the fetch module and caches it
   */
  public static async fetch(): Promise<typeof import('node-fetch')> {
    if (Common.#fetch === undefined)
      Common.#fetch = await import('node-fetch').catch((error: any) => {
        throw new Error(`Could not import node-fetch\n${error}`);
      });
    return Common.#fetch;
  }
}
