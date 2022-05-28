import { ClientRequest, IncomingMessage } from 'http';
import { request, RequestOptions } from 'https';
import Settings from './Settings';

interface AccessToken {
  access_token: string;
  expires_at: number;
}

export default abstract class Common {
  public static _discordAccessToken?: AccessToken;

  public static sanitize(content: string): string {
    return content.replace(/([_*\\|`])/g, '\\$1');
  }

  public static accessTokenValid(): boolean {
    return (Common._discordAccessToken?.expires_at ?? 0) > Date.now();
  }
}

export async function requestWrapper(
  options: RequestOptions,
  data?: string
): Promise<string> {
  return new Promise(
    (resolve: (data: string) => void, reject: (e: Error) => void): void => {
      if (Settings.getSettings()['proxy'] !== undefined) {
        options.path = `https://${options.host}${options.path}`;
        if (!options.headers) options.headers = {};
        options.headers.Host = options.host as string;
        options.host = Settings.getSettings()['proxy']!.host;
        options.port = Settings.getSettings()['proxy']!.port;
      }

      const req: ClientRequest = request(
        options,
        (res: IncomingMessage): void => {
          let data: string = '';
          res.on('error', reject);
          res.on('data', (chunk: Buffer): string => (data += chunk));
          res.on('end', () => resolve(data));
        }
      );
      if (data !== undefined) req.end(data);
    }
  );
}
