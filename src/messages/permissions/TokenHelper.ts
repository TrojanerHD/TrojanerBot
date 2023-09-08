import { Guild } from 'discord.js';
import Authentication, { MaybeTokenResponse, TokenResponse } from './Authentication';
import { GuildInfo } from '../../settings/SettingsDB';
import GuildSettings from '../../settings/GuildSettings';
import Common from '../../common';
import AuthenticationServer from './AuthenticationServer';

/**
 * Util functions to handle a Discord user token
 */
export default abstract class TokenHelper {
  /**
   * Get a new access token if a refresh token exists
   * @param guild The guild to update the access token for
   * @returns The access token request promise
   */
  static async getAccessToken(guild: Guild): Promise<void> {
    AuthenticationServer.startServer();

    const refreshToken: string | undefined =
      await TokenHelper.getRefreshToken(guild.id);
    if (refreshToken === undefined) throw new Error('No refresh token');
    let req: MaybeTokenResponse = undefined;
    while (req === undefined)
      req = await Authentication.makeRequest(refreshToken).catch(console.error);

    return TokenHelper.storeToken(req, guild);
  }


  /**
   * Obtains a refresh token for given guild
   * @param guildId The guild id to obtain a refresh token from
   * @returns The refresh token
   */
  public static async getRefreshToken(
    guildId: string
  ): Promise<string | undefined> {
    AuthenticationServer.startServer();

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
        TokenHelper.deleteRefreshToken(guild);
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
}