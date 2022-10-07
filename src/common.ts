import { ClientRequest, IncomingMessage } from 'http';
import { request, RequestOptions } from 'https';

interface AccessToken {
  access_token: string;
  expires_at: number;
}

/**
 * Common functions used throughout the project
 */
export default abstract class Common {
  /**
   * The access token for the Discord API
   */
  public static _discordAccessToken?: AccessToken;

  /**
   * Sanitizes messages for safe use in message contents
   * @param content The content to sanitize
   * @returns The sanitized content
   */
  public static sanitize(content: string): string {
    return content.replace(/([_*\\|`])/g, '\\$1');
  }

  /**
   * Checks whether the Discord token is valid
   * @returns Whether the Discord token is valid
   */
  public static accessTokenValid(): boolean {
    return (Common._discordAccessToken?.expires_at ?? 0) > Date.now();
  }
}

/**
 * A request wrapper for asynchronous use of requests
 * @param options Request options
 * @param data Request data / content
 * @returns The response of the request
 */
export async function requestWrapper(
  options: RequestOptions,
  data?: string
): Promise<string> {
  return new Promise(
    (resolve: (data: string) => void, reject: (e: Error) => void): void => {
      const req: ClientRequest = request(
        options,
        (res: IncomingMessage): void => {
          let data: string = '';
          res.on('error', reject);
          res.on('data', (chunk: Buffer): string => (data += chunk));
          res.on('end', (): void => resolve(data));
        }
      );

      req.on('error', reject);

      if (data !== undefined) req.end(data);
    }
  );
}
