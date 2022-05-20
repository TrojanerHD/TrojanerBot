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

/**
 * Creates an express app for the user to authorize the bot to allow changing command permissions
 */
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

  /**
   * Get a new access token if a refresh token exists
   * @returns The access token request promise
   */
  static getAccessToken(): Promise<void> {
    if (process.env.DISCORD_REFRESH_TOKEN === undefined)
      throw new Error('No refresh token');
    return this.makeRequest();
  }

  /**
   * Creates a request to get a new access token, either via a refresh token or a code
   * @param data The code and redirect URI. The redirect uri must match the URI with which the code request was made. If undefined, the function will use the refresh token
   * @returns A promise that resolves after the request is made
   * @example Authentication.makeRequest({ code: '<code>', redirect: 'http://localhost:3000' })
   */
  private static async makeRequest(data?: {
    code: string;
    redirect: string;
  }): Promise<void> {
    const params = new URLSearchParams();
    params.append('client_id', DiscordClient._client.application!.id);
    params.append('client_secret', process.env.OAUTH_TOKEN!);
    // When data is set, the request is made with a code
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

    // Authorization is not required for the request when using the refresh_token
    if (data !== undefined)
      reqObj.headers!.Authorization = `Basic ${Buffer.from(
        `${DiscordClient._client.application?.id}:${process.env.DISCORD_TOKEN}`
      ).toString('base64')}`;

    const req: string = await request(reqObj, params.toString());
    const json: TokenResponse | { error: string } = JSON.parse(req);
    if ('error' in json) {
      // If the refresh token is invalid, delete it and reject the promise
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
    // If the refresh token is not set, add it to the .env file
    if (process.env.DISCORD_REFRESH_TOKEN === undefined) {
      fs.appendFile(
        './.env',
        `\nDISCORD_REFRESH_TOKEN=${json.refresh_token}`,
        (err: NodeJS.ErrnoException | null): void => {
          if (err) console.error(err);
        }
      );
      // Also add the refresh token to the process.env for the current runtime
      process.env.DISCORD_REFRESH_TOKEN = json.refresh_token;
    }
    // Set the access token
    Common._discordAccessToken = {
      access_token: json.access_token,
      expires_at: Date.now() + json.expires_in * 1000,
    };
  }
}
