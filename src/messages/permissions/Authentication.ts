import express, { Express } from 'express';
import DiscordClient from '../../DiscordClient';
import { URLSearchParams } from 'url';
import Common, { requestWrapper as request } from '../../common';
import { RequestOptions } from 'https';
import { Server } from 'http';
import Settings, { SettingsJSON } from '../../Settings';
import { GuildInfo } from '../../settings/SettingsDB';
import GuildSettings from '../../settings/GuildSettings';
import { Guild } from 'discord.js';

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token: string;
}

export type MaybeTokenResponse = TokenResponse | { error: string } | void;

/**
 * Creates an express app for the user to authorize the bot to allow changing command permissions
 */
export default abstract class Authentication {
  static #app: Express = express();
  static #server?: Server = undefined;
  static #listeners: {
    guildId: string;
    listener: (json?: MaybeTokenResponse) => void;
  }[] = [];

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
   * Starts the express server if it has not been started.
   * If no guilds are left that need authentication, the express server is stopped
   */
  public static startServer(): void {
    if (Authentication.#server !== undefined) {
      if (!Authentication.#server.listening) Authentication.listen();
      return;
    }
    if (Settings.settings.logging !== 'errors')
      console.log('Start express server');

    Authentication.#app.get('/', (req, res): void => {
      const request = Authentication.makeRequest(
        req.query.code as string,
        `${req.protocol}://${req.headers.host as string}${req.path}`
      ).catch(console.error);

      request.then((response: MaybeTokenResponse): void =>
        Authentication.#listeners
          .find(
            (listener: {
              guildId: string;
              listener: (json?: MaybeTokenResponse) => void;
            }) => req.query.state === listener.guildId
          )
          ?.listener(response)
      );

      res.send('Successfully authorized');

      // Stop express app
      if (Authentication.#listeners.length - 1 <= 0) {
        Authentication.#server?.close();
        if (Settings.settings.logging !== 'errors')
          console.log('Stop express server');
      }
    });
    Authentication.listen();
  }

  /**
   * Updates internal server parameter to listen on the app
   */
  private static listen(): void {
    if (
      Settings.settings['express-port'] !== undefined &&
      Settings.settings['express-port'] !== null &&
      Settings.settings['express-port']! > 0
    )
      Authentication.#server = Authentication.#app.listen(
        Settings.settings['express-port']
      );
    else Authentication.#server = Authentication.#app.listen();
  }

  /**
   * Get a new access token if a refresh token exists
   * @param guild The guild to update the access token for
   * @returns The access token request promise
   */
  static async getAccessToken(guild: Guild): Promise<void> {
    Authentication.startServer();

    const refreshToken: string | undefined =
      await Authentication.getRefreshToken(guild.id);
    if (refreshToken === undefined) throw new Error('No refresh token');
    let req: MaybeTokenResponse = undefined;
    while (req === undefined)
      req = await Authentication.makeRequest(refreshToken).catch(console.error);

    return Authentication.storeToken(req, guild);
  }

  /**
   * Creates a request to get a new access token, either via a refresh token or a code
   * @param codeOrRefreshToken The code. If redirect is undefined, this acts as a refresh token instead
   * @param redirect The redirect URI. Must match the URI with which the code request was made. If undefined, the function will use the first parameter as refresh token
   * @returns A promise for the token response
   * @example Authentication.makeRequest('<code>', 'http://localhost:3000');
   * @example Authentication.makeRequest('<refresh_token>');
   */
  private static async makeRequest(
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
   * Obtains a refresh token for given guild
   * @param guildId The guild id to obtain a refresh token from
   * @returns The refresh token
   */
  public static async getRefreshToken(
    guildId: string
  ): Promise<string | undefined> {
    Authentication.startServer();

    const settings: GuildInfo = await GuildSettings.settings(guildId);
    return settings.refreshToken !== '' ? settings.refreshToken : undefined;
  }

  /**
   * Deletes the stored refresh token for given guild
   * Might be used if the refresh token becomes invalid
   * @param guild The guild to delete the refresh token from
   */
  public static async deleteRefreshToken(guild: Guild): Promise<void> {
    const settings: GuildInfo = await GuildSettings.settings(guild.id);
    settings.refreshToken = '';
    await GuildSettings.saveSettings(guild, settings).catch(console.error);
  }

  /**
   * Stores a refresh token for given guild using given json after making a refresh token retrieval request
   * @param json The response from the refresh token request
   * @param guild The guild to store the refresh token for
   */
  public static async storeToken(
    json: TokenResponse | { error: string },
    guild: Guild
  ): Promise<void> {
    if ('error' in json) {
      // If the refresh token is invalid, delete it and reject the promise
      if (json.error === 'invalid_grant')
        Authentication.deleteRefreshToken(guild);
      return Promise.reject(new Error(json.error));
    }

    const settings: GuildInfo = await GuildSettings.settings(guild.id);
    settings.refreshToken = json.refresh_token;
    await GuildSettings.saveSettings(guild, settings).catch(console.error);

    Common._discordAccessTokens[guild.id] = {
      access_token: json.access_token,
      expires_at: Date.now() + json.expires_in * 1000,
    };
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
   * Removes a guild as listener for an authorization request
   * Is to be called after a guild's refresh token has been successfully added
   * @param guildId The guild to remove the listener for
   */
  public static removeListener(guildId: string): void {
    this.#listeners = this.#listeners.filter(
      (listener: {
        guildId: string;
        listener: (json?: MaybeTokenResponse) => void;
      }): boolean => listener.guildId !== guildId
    );
  }
}
