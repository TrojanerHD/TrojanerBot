import {
  Collection,
  Emoji,
  Guild,
  GuildChannel,
  Message,
  MessageEmbed,
  Snowflake,
  TextChannel,
} from 'discord.js';
import Settings from '../settings';
import { DiscordClient } from '../DiscordClient';

interface Role {
  name: string;
  emoji: string;
}

export default class RoleManager {
  private _newEmbeds: { embed: MessageEmbed; usedEmoji: string[] }[] = [];
  private _rolesChannel: undefined | TextChannel;
  private _guild: undefined | Guild;
  private _newEmbed: { embed: MessageEmbed; usedEmoji: string[] } | undefined;

  constructor() {
    for (const guild of DiscordClient._client.guilds.cache.array()) {
      this._guild = guild;
      this._rolesChannel = <TextChannel>(
        guild.channels.cache
          .array()
          .find(
            (channel: GuildChannel) =>
              channel.name === 'roles' && channel.type === 'text'
          )
      );
      if (!this._rolesChannel) continue;

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

      while (embed.processed !== Settings.getSettings().roles.length) {
        embed = this.generateEmbed(embed.processed, embed.number);
        this._newEmbeds.push({
          embed: embed.embed,
          usedEmoji: embed.usedEmoji,
        });
      }

      this._rolesChannel.messages
        .fetch({ limit: 10 })
        .then(this.messagesFetched.bind(this))
        .catch(console.error);
    }
  }

  private messagesFetched(messages: Collection<Snowflake, Message>): void {
    const rolesMessages = messages.array();
    for (let i = 0; i < this._newEmbeds.length; i++) {
      this._newEmbed = this._newEmbeds[i];
      if (!rolesMessages[i]) {
        this._rolesChannel!.send(this._newEmbed!.embed)
          .catch(console.error)
          .then(this.reactToMessage.bind(this));
        continue;
      }
      rolesMessages[i]
        .edit(this._newEmbed!.embed)
        .catch(console.error)
        .then((message: void | Message) => {
          if (!(message instanceof Message)) return;
          message.reactions.removeAll().then(this.reactToMessage.bind(this)).catch(console.error);
        });
    }
  }

  reactToMessage(message: void | Message): void {
    if (!(message instanceof Message)) return;
    for (const emoji of this._newEmbed!.usedEmoji) {
      message.react(this._guild!.emojis.cache.get(emoji)!).catch(console.error);
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
      const role: Role = Settings.getSettings().roles[i];
      usedEmoji.push(role.emoji);
      embed.addField(
        role.name,
        new Emoji(
          DiscordClient._client,
          this._guild!.emojis.cache.get(role.emoji)!
        ),
        true
      );
      processed++;
    }

    return { embed, processed, number: number++, usedEmoji };
  }
}
