import {
  ApplicationCommandPermissions,
  Collection,
  PermissionFlagsBits,
  Role,
  Snowflake,
} from 'discord.js';
import { requestWrapper as request } from '../../common';
import Common from '../../common';
import DiscordClient from '../../DiscordClient';
import Settings, { SettingsJSON } from '../../Settings';
import { ApplicationCommandType } from '../MessageHandler';
import Authentication from './Authentication';
import { RequestOptions } from 'https';

/**
 * Set permissions for commands
 */
export default class CommandPermissions {
  #commands?: Collection<string, ApplicationCommandType>;

  /**
   * Is to be called after commands have been set
   * @param commands The commands to set permissions for
   */
  onCommandsSet(commands: Collection<Snowflake, ApplicationCommandType>): void {
    this.#commands = commands;
    if (process.env.DISCORD_REFRESH_TOKEN !== undefined) {
      if (!Common.accessTokenValid())
        Authentication.getAccessToken()
          .then(this.setPermissions.bind(this))
          .catch((err: Error): void => {
            if (err.message !== 'invalid_grant') throw new Error(err.message);
            new Authentication(this.setPermissions.bind(this));
          });
      else this.setPermissions();
      return;
    }
    if (Settings.settings['logging'] !== 'errors')
      new Authentication(this.setPermissions.bind(this));
  }

  /**
   * Set permissions for commands, is used as callback for when the user has been authorized and an access token is available
   */
  private async setPermissions(): Promise<void> {
    for (const command of this.#commands!.toJSON().filter(
      (command: ApplicationCommandType): boolean =>
        command.defaultMemberPermissions?.bitfield ===
        PermissionFlagsBits.ManageGuild
    )) {
      for (const guild of DiscordClient._client.guilds.cache.toJSON()) {
        const body: { permissions: ApplicationCommandPermissions[] } = {
          permissions: Settings.settings['permission-roles']
            .filter((roleName: string): boolean =>
              guild.roles.cache.some(
                (role: Role): boolean => role.name === roleName
              )
            )
            .map(
              (roleName: string): ApplicationCommandPermissions => ({
                id: guild.roles.cache.find(
                  (role: Role): boolean => role.name === roleName
                )!.id,
                type: 1, // Role, see https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-structure
                permission: true,
              })
            ),
        };

        const reqObj: RequestOptions = {
          host: 'discord.com',
          path: `/api/v10/applications/${DiscordClient._client.application?.id}/guilds/${guild.id}/commands/${command.id}/permissions`,
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${Common._discordAccessToken!.access_token}`,
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
          req = await request(reqObj, JSON.stringify(body)).catch(
            console.error
          );
      }
    }
  }
}
