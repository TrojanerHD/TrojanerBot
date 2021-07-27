import {
  Emoji,
  Guild,
  GuildChannel,
  GuildEmoji,
  MessageEmbed,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import Settings from '../Settings';
import { DiscordClient } from '../DiscordClient';
import GuildRolesManager from './GuildRolesManager';

export interface CustomRole {
  name: string;
  emoji: string;
}

export interface EmojiEmbed {
  embed: MessageEmbed;
  usedEmoji: string[];
}

export default class RoleManager {
  #guild?: Guild;

  constructor() {
    for (const guild of DiscordClient._client.guilds.cache.array()) {
      this.#guild = guild;
      const rolesChannel:
        | TextChannel
        | undefined = guild.channels.cache
        .array()
        .find(
          (channel: GuildChannel | ThreadChannel): boolean =>
            channel.name === 'roles' && channel.type === 'text'
        ) as TextChannel | undefined;
      if (!rolesChannel) continue;

      let embed: {
        embed: MessageEmbed;
        processed: number;
        number: number;
        usedEmoji: string[];
      } = {
        embed: new MessageEmbed(),
        processed: 0,
        number: 0,
        usedEmoji: [],
      };

      const newEmbeds: EmojiEmbed[] = [];
      while (embed.processed !== Settings.getSettings().roles.length) {
        embed = this.generateEmbed(embed.processed, embed.number);
        newEmbeds.push({
          embed: embed.embed,
          usedEmoji: embed.usedEmoji,
        });
      }

      new GuildRolesManager(guild).checkRolesChannel(rolesChannel, newEmbeds);
    }
  }

  private generateEmbed(
    processed: number = 0,
    number: number = 0
  ): {
    embed: MessageEmbed;
    processed: number;
    number: number;
    usedEmoji: string[];
  } {
    const embed: MessageEmbed = new MessageEmbed()
      .setTimestamp(new Date())
      .setTitle('Role Selector');

    const usedEmoji: string[] = [];

    for (
      let i = processed;
      processed < Settings.getSettings().roles.length || i - processed === 4;
      i++
    ) {
      const role: CustomRole = Settings.getSettings().roles[i];
      usedEmoji.push(role.emoji);

      const emoji:
        | GuildEmoji
        | undefined = this.#guild!.emojis.cache.array().find(
        (value: GuildEmoji) => value.id == role.emoji
      );
      let emojiField: string | Emoji = '';
      if (!emoji) emojiField = role.emoji;
      else emojiField = new Emoji(DiscordClient._client, emoji);
      embed.addField(role.name, emojiField instanceof Emoji ? emojiField.toString() : emojiField, true);
      processed++;
    }

    return { embed, processed, number: number++, usedEmoji };
  }
}
