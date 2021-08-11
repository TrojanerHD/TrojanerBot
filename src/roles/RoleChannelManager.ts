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
import GuildRolesManager from './GuildRolesManager';
import { GuildTextChannel } from '../messages/Command';

export default class RoleManager {
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

      new GuildRolesManager(rolesChannel, embed);
    }
  }

  private generateEmbed(): MessageEmbed {
    const embed: MessageEmbed = new MessageEmbed()
      .setTimestamp(new Date())
      .setTitle('Role Selector')
      .setFields(
        Settings.getSettings().roles.map(
          (role: RolesField): EmbedFieldData => ({
            name: role.name,
            value: role.description,
          })
        )
      );
    return embed;
  }
}
