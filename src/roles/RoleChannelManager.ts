import {
  EmbedFieldData,
  GuildChannel,
  MessageEmbed,
  NewsChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import Settings, { RolesField } from '../Settings';
import DiscordClient from '../DiscordClient';
import manageRoles from './manageRoles';
import { GuildTextChannel } from '../messages/Command';

export default class RoleChannelManager {
  constructor() {
    for (const guild of DiscordClient._client.guilds.cache.toJSON()) {
      const rolesChannel: GuildTextChannel | undefined =
        guild.channels.cache.find(
          (channel: GuildChannel | ThreadChannel): boolean =>
            channel.name === 'roles' &&
            (channel instanceof TextChannel ||
              channel instanceof ThreadChannel ||
              channel instanceof NewsChannel)
        ) as GuildTextChannel | undefined;
      if (!rolesChannel) continue;

      const embed: MessageEmbed = this.generateEmbed();

      manageRoles(rolesChannel, embed);
    }
  }

  private generateEmbed(): MessageEmbed {
    const roles: RolesField[] = Settings.getSettings().roles;
    const errorRole: boolean = roles.some(
      (role: RolesField): boolean => !role.emoji || !role.name
    );
    if (errorRole)
      return new MessageEmbed()
        .setTimestamp(new Date())
        .setTitle('Role Selector')
        .setDescription(
          'Error: All fields in `role` in `settings.json` must have a `name` and `emoji` tag'
        )
        .setColor('RED');
    return new MessageEmbed()
      .setTimestamp(new Date())
      .setTitle('Role Selector')
      .setFields(
        Settings.getSettings().roles.map(
          (role: RolesField): EmbedFieldData => ({
            name: role.name,
            value: role.description || '*No description provided*',
          })
        )
      );
  }
}
