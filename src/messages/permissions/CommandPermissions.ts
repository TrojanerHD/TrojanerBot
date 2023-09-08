import {
  ApplicationCommandPermissions,
  Collection,
  Guild,
  PermissionFlagsBits,
  Role,
  Snowflake,
} from 'discord.js';
import { requestWrapper as request } from '../../common';
import Common from '../../common';
import DiscordClient from '../../DiscordClient';
import Settings, { SettingsJSON } from '../../Settings';
import { ApplicationCommandType } from '../MessageHandler';
import Authentication, { MaybeTokenResponse } from './Authentication';
import TokenHelper from './TokenHelper';
import { RequestOptions } from 'https';
import GuildSettings from '../../settings/GuildSettings';

/**
 * Set permissions for commands
 */
export default class CommandPermissions {
  #commands?: Collection<string, ApplicationCommandType>;
  #guild: Guild;

  constructor(guild: Guild) {
    this.#guild = guild;
  }

  /**
   * Is to be called after commands have been set
   * @param commands The commands to set permissions for
   */
  async onCommandsSet(
    commands: Collection<Snowflake, ApplicationCommandType>
  ): Promise<void> {
    this.#commands = commands;

    const refreshToken = await TokenHelper.getRefreshToken(this.#guild.id);

    if (refreshToken !== undefined) {
      if (!Common.accessTokenValid(this.#guild.id))
        TokenHelper.getAccessToken(this.#guild)
          .then(this.accessTokenReceived.bind(this))
          .catch((err: Error): void => {
            if (err.message !== 'invalid_grant') throw new Error(err.message);

            Authentication.startServer();
            Authentication.addListener(
              this.#guild.id,
              this.accessTokenReceived.bind(this)
            );
          });
      else this.accessTokenReceived();
      return;
    }
    Authentication.startServer();
    Authentication.addListener(
      this.#guild.id,
      this.accessTokenReceived.bind(this)
    );
  }

  /**
   * Is used as callback for when the user has been authorized and an access token is available
   *
   * - Stores the access token for the guild
   * - Sets command permissions for the guild
   */
  private async accessTokenReceived(json?: MaybeTokenResponse): Promise<void> {
    if (Authentication.hasListener(this.#guild.id))
      Authentication.removeListener(this.#guild.id);

    if (json !== undefined) await TokenHelper.storeToken(json, this.#guild);
    await this.setPermissions();
  }

  /**
   * Set permissions for commands
   */
  private async setPermissions(): Promise<void> {
    for (const command of this.#commands!.toJSON().filter(
      (command: ApplicationCommandType): boolean =>
        command.defaultMemberPermissions?.bitfield ===
        PermissionFlagsBits.ManageGuild
    )) {
      const body: { permissions: ApplicationCommandPermissions[] } = {
        permissions: (
          await GuildSettings.settings(this.#guild.id)
        ).permissionRoles
          .filter((roleId: string): boolean =>
            this.#guild!.roles.cache.some(
              (role: Role): boolean => role.id === roleId
            )
          )
          .map(
            (roleId: string): ApplicationCommandPermissions => ({
              id: this.#guild.roles.cache.find(
                (role: Role): boolean => role.id === roleId
              )!.id,
              type: 1, // Role, see https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-structure
              permission: true,
            })
          ),
      };

      const reqObj: RequestOptions = {
        host: 'discord.com',
        path: `/api/v10/applications/${
          DiscordClient._client.application?.id
        }/guilds/${this.#guild.id}/commands/${command.id}/permissions`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${
            Common._discordAccessTokens[this.#guild.id]!.access_token
          }`,
          'Content-Type': 'application/json',
        },
      };

      const tempSettings: SettingsJSON = Settings.settings;

      if (tempSettings.proxy !== undefined) {
        reqObj.host = tempSettings.proxy.host;
        reqObj.port = tempSettings.proxy.port;
        reqObj.path = `https://discord.com${reqObj.path}`;
        reqObj.headers!.Host = 'discord.com';
      }

      let req: string | void = undefined;
      while (req === undefined)
        req = await request(reqObj, JSON.stringify(body)).catch(console.error);
    }
  }
}
