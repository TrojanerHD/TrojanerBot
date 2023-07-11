import {
  APIEmbedField,
  GuildChannel,
  GuildTextBasedChannel,
  NewsChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import Settings, { RolesField } from '../Settings';
import DiscordClient from '../DiscordClient';
import manageRoles from './manageRoles';
import { EmbedBuilder } from '@discordjs/builders';

/**
 * Manages the roles for each user with a message with button in a channel
 */
export default class RoleChannelManager {
  constructor() {
    for (const guild of DiscordClient._client.guilds.cache.toJSON()) {
      const rolesChannel: GuildTextBasedChannel | undefined =
        guild.channels.cache.find(
          (channel: GuildChannel | ThreadChannel): boolean =>
            channel.name === 'roles' &&
            (channel instanceof TextChannel ||
              channel instanceof ThreadChannel ||
              channel instanceof NewsChannel)
        ) as GuildTextBasedChannel | undefined;
      if (!rolesChannel) continue;

      const embed: EmbedBuilder = this.generateEmbed();

      manageRoles(rolesChannel, embed);
    }
  }

  private generateEmbed(): EmbedBuilder {
    const roles: RolesField[] = Settings.settings.roles;
    const errorRole: boolean = roles.some(
      (role: RolesField): boolean => !role.emoji || !role.name
    );
    if (errorRole)
      return new EmbedBuilder()
        .setTimestamp(Date.now())
        .setTitle('Role Selector')
        .setDescription(
          'Error: All fields in `role` in `settings.json` must have a `name` and `emoji` tag'
        )
        .setColor([255, 0, 0]);
    return new EmbedBuilder()
      .setTimestamp(Date.now())
      .setTitle('Role Selector')
      .setFields(
        Settings.settings.roles.map(
          (role: RolesField): APIEmbedField => ({
            name: role.name,
            value: role.description || '*No description provided*',
          })
        )
      );
  }
}
