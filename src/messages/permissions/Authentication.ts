import express from 'express';
import DiscordClient from '../../DiscordClient';
import { URLSearchParams } from 'url';
import { request, RequestOptions } from 'https';
import { IncomingMessage, Server } from 'http';
import fs from 'fs';
import Common from '../../common';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token: string;
}

export default class Authentication {
  #app = express();
  #server: Server;

  constructor(callback: () => void) {
    console.log(
      `Warning: To update the command's permissions, please authenticate the application at https://discord.com/oauth2/authorize?client_id=${DiscordClient._client.application?.id}&scope=applications.commands.permissions.update&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000`
    );
    this.#app.get('/', async (req, res): Promise<void> => {
      Authentication.makeRequest(callback, req.query.code as string);
      res.send('Successfully authorized');

      // Stop express app
      this.#server.close();
    });
    this.#server = this.#app.listen(3000);
  }

  static getAccessToken(callback: () => void) {
    this.makeRequest(callback);
  }

  private static makeRequest(callback: () => void, code?: string): void {
    const params = new URLSearchParams();
    params.append('client_id', DiscordClient._client.application!.id);
    params.append('client_secret', process.env.OAUTH_TOKEN!);
    if (code !== undefined) {
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', 'http://localhost:3000');
    } else {
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', process.env.DISCORD_REFRESH_TOKEN!);
    }
    const reqObj: RequestOptions = {
      host: 'discord.com',
      path: '/api/v10/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': params.toString().length,
      },
    };

    if (code !== undefined)
      reqObj.headers!.Authorization = `Basic ${Buffer.from(
        `${DiscordClient._client.application?.id}:${process.env.DISCORD_TOKEN}`
      ).toString('base64')}`;

    request(reqObj, (res: IncomingMessage) => {
      let data: string = '';
      res.on('data', (chunk: Buffer): string => (data += chunk.toString()));
      res.on('end', (): void => {
        const json: TokenResponse | { error: string } = JSON.parse(data);
        if ('error' in json) {
          if (json.error === 'invalid_grant' && code === undefined) {
            process.env.DISCORD_REFRESH_TOKEN = undefined;
            // Delete line of .env that says DISCORD_REFRESH_TOKEN
            fs.writeFileSync(
              '.env',
              fs
                .readFileSync('.env', 'utf8')
                .replace(/\n?DISCORD_REFRESH_TOKEN=.*/, '')
            );
            new Authentication(callback);
            return;
          }
          throw new Error(`Authentication error: ${JSON.stringify(json)}`);
        }
        if (process.env.DISCORD_REFRESH_TOKEN === undefined) {
          fs.appendFile(
            './.env',
            `\nDISCORD_REFRESH_TOKEN=${json.refresh_token}`,
            (err: NodeJS.ErrnoException | null): void => {
              if (err) console.error(err);
            }
          );
          process.env.DISCORD_REFRESH_TOKEN = json.refresh_token;
        }
        Common._discordAccessToken = {
          access_token: json.access_token,
          expires_at: Date.now() + json.expires_in * 1000,
        };
        callback();
      });
      res.on('error', console.error);
    }).end(params.toString());
  }
}
