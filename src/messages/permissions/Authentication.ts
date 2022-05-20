import express, { Express } from 'express';
import DiscordClient from '../../DiscordClient';
import { URLSearchParams } from 'url';
import { requestWrapper as request } from '../../common';
import { RequestOptions } from 'https';
import { Server } from 'http';
import fs from 'fs';
import Common from '../../common';
import Settings from '../../Settings';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token: string;
}

export default class Authentication {
  #app: Express = express();
  #server: Server;

  constructor(callback: () => void) {
    console.log(
      `Warning: To update the command's permissions, please authenticate the application at https://discord.com/oauth2/authorize?client_id=${DiscordClient._client.application?.id}&scope=applications.commands.permissions.update&response_type=code&redirect_uri=<redirect_uri>`
    );
    this.#app.get('/', (req, res): void => {
      Authentication.makeRequest({
        code: req.query.code as string,
        redirect: `${req.protocol}://${req.headers.host as string}${req.path}`,
      })
        .then(callback)
        .catch(console.error);
      res.send('Successfully authorized');

      // Stop express app
      this.#server.close();
    });
    if (
      Settings.getSettings()['express-port'] !== undefined &&
      Settings.getSettings()['express-port'] !== null &&
      Settings.getSettings()['express-port']! > 0
    )
      this.#server = this.#app.listen(Settings.getSettings()['express-port']);
    else this.#server = this.#app.listen();
  }

  static getAccessToken(callback: () => void): void {
    this.makeRequest()
      .then(callback)
      .catch((err: Error): void => {
        if (err.message !== 'invalid_grant') throw new Error(err.message);
        new Authentication(callback);
      });
  }

  private static async makeRequest(data?: {
    code: string;
    redirect: string;
  }): Promise<void> {
    const params = new URLSearchParams();
    params.append('client_id', DiscordClient._client.application!.id);
    params.append('client_secret', process.env.OAUTH_TOKEN!);
    if (data !== undefined) {
      params.append('grant_type', 'authorization_code');
      params.append('code', data.code);
      params.append('redirect_uri', data.redirect);
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

    if (data !== undefined)
      reqObj.headers!.Authorization = `Basic ${Buffer.from(
        `${DiscordClient._client.application?.id}:${process.env.DISCORD_TOKEN}`
      ).toString('base64')}`;

    const req: string = await request(reqObj, params.toString());
    const json: TokenResponse | { error: string } = JSON.parse(req);
    if ('error' in json) {
      if (json.error === 'invalid_grant' && data === undefined) {
        process.env.DISCORD_REFRESH_TOKEN = undefined;
        // Delete line of .env that says DISCORD_REFRESH_TOKEN
        fs.writeFileSync(
          '.env',
          fs
            .readFileSync('.env', 'utf8')
            .replace(/\n?DISCORD_REFRESH_TOKEN=.*/, '')
        );
      }
      return Promise.reject(new Error(json.error));
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
  }
}
