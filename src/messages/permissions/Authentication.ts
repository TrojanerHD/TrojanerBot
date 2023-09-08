import DiscordClient from '../../DiscordClient';
import { URLSearchParams } from 'url';
import { requestWrapper as request } from '../../common';
import { RequestOptions } from 'https';
import Settings, { SettingsJSON } from '../../Settings';
import AuthenticationServer from './AuthenticationServer';
import { Request, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token: string;
}

export type MaybeTokenResponse = TokenResponse | { error: string } | void;

export interface Listener {
  guildId: string;
  listener: (json?: MaybeTokenResponse) => void;
}

/**
 * Handles authentication for command permission updating
 */
export default abstract class Authentication {
  static #listeners: Listener[] = [];

  static authenticationCallback(req: Request<{}, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>, number>): void {
      const request = Authentication.makeRequest(
        req.query.code as string,
        `${req.protocol}://${req.headers.host as string}${req.path}`
      ).catch(console.error);

      request.then((response: MaybeTokenResponse): void =>
        Authentication.#listeners
          .find((listener: Listener) => req.query.state === listener.guildId)
          ?.listener(response)
      );

      res.send('Successfully authorized');

      // Stop express app
      if (Authentication.#listeners.length - 1 <= 0) {
        AuthenticationServer.closeServer();
        if (Settings.settings.logging !== 'errors')
          console.log('Stop express server');
      }
  }

  /**
   * Creates a request to get a new access token, either via a refresh token or a code
   * @param codeOrRefreshToken The code. If redirect is undefined, this acts as a refresh token instead
   * @param redirect The redirect URI. Must match the URI with which the code request was made. If undefined, the function will use the first parameter as refresh token
   * @returns A promise for the token response
   * @example Authentication.makeRequest('<code>', 'http://localhost:3000');
   * @example Authentication.makeRequest('<refresh_token>');
   */
  static async makeRequest(
    codeOrRefreshToken: string,
    redirect?: string
  ): Promise<TokenResponse | { error: string }> {
    const params = new URLSearchParams();
    params.append('client_id', DiscordClient._client.application!.id);
    params.append('client_secret', process.env.OAUTH_TOKEN!);
    // Make request using code
    if (redirect !== undefined) {
      params.append('grant_type', 'authorization_code');
      params.append('code', codeOrRefreshToken);
      params.append('redirect_uri', redirect);
    } else {
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', codeOrRefreshToken);
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

    const tempSettings: SettingsJSON = Settings.settings;

    if (tempSettings.proxy !== undefined) {
      reqObj.host = tempSettings.proxy.host;
      reqObj.port = tempSettings.proxy.port;
      reqObj.path = `https://discord.com${reqObj.path}`;
      reqObj.headers!.Host = 'discord.com';
    }

    // Authorization is not required for the request when using the refresh_token
    if (redirect !== undefined)
      reqObj.headers!.Authorization = `Basic ${Buffer.from(
        `${DiscordClient._client.application?.id}:${process.env.DISCORD_TOKEN}`
      ).toString('base64')}`;

    let req: string | void = undefined;
    while (req === undefined)
      req = await request(reqObj, params.toString()).catch(console.error);

    return JSON.parse(req);
  }

  /**
   * Creates an authorization url for given guild
   * @param guildId The guild id to create the authorization url for
   * @returns The authorization url
   */
  public static createURL(guildId: string): string {
    return `https://discord.com/oauth2/authorize?client_id=${DiscordClient._client.application?.id}&scope=applications.commands.permissions.update&response_type=code&state=${guildId}`;
  }

  /**
   * Adds a callback that gets executed whenever somebody authorizes
   * @param guildId The guild id that was authorized
   * @param listener The callback to be executed
   */
  public static addListener(
    guildId: string,
    listener: (json: MaybeTokenResponse) => void
  ) {
    Authentication.#listeners.push({ guildId, listener });
  }

  /**
   * Removes a guild as listener for an authorization request
   * Is to be called after a guild's refresh token has been successfully added
   * @param guildId The guild to remove the listener for
   */
  public static removeListener(guildId: string): void {
    this.#listeners = this.#listeners.filter(
      (listener: Listener): boolean => listener.guildId !== guildId
    );
  }

  /**
   * Checks whether a listener exists for a guild
   * @param guildId The guild to check whether a listener exists for
   * @returns Whether a listener exists for given guild
   */
  public static hasListener(guildId: string): boolean {
    return this.#listeners.some(
      (listener: Listener): boolean => listener.guildId === guildId
    );
  }
}
