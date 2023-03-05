import {
  MessageEmbed,
  TextChannel,
  Message,
  Collection,
  ThreadChannel,
  NewsChannel,
  GuildBasedChannel,
  EmbedFieldData,
  Guild,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { GuildTextChannel } from '../messages/Command';

interface StreamInformation {
  name: string;
  title: string;
  category?: string;
  viewer_count: number;
}

/**
 * Creates the embed for #live
 */
export default class CreateEmbed {
  #embed: EmbedFieldData[][] = [];
  readonly #guild: Guild;

  constructor(guild: Guild) {
    this.#guild = guild;
  }

  /**
   * Adds a formatted field to the embed containing information about a stream
   * @param streamInformation The information to be inserted into the embed field
   */
  addField(streamInformation: StreamInformation): void {
    if (streamInformation.title === ' ') streamInformation.title = '\u200b';
    const size =
      streamInformation.viewer_count <= 50
        ? 'Small'
        : streamInformation.viewer_count <= 1000
        ? 'Medium'
        : streamInformation.viewer_count <= 10000
        ? 'Large'
        : 'Very Large';

    const fieldArray: EmbedFieldData[] = [
      {
        name: 'Streamer',
        value: `[${streamInformation.name}](https://twitch.tv/${streamInformation.name})`,
        inline: true,
      },
      { name: 'Title', value: streamInformation.title, inline: true },
      { name: 'Size', value: size, inline: true },
    ];
    if (streamInformation.category !== undefined)
      fieldArray.push({
        name: 'Category',
        value: streamInformation.category,
        inline: false,
      });
    this.#embed.push(fieldArray);
  }

  /**
   * Sends the embed into #live
   */
  async sendEmbed(): Promise<void> {
    const liveChannel: GuildTextChannel | undefined =
      CreateEmbed.determineLiveChannel(this.#guild);
    if (liveChannel === undefined) return;

    const messages: Collection<string, Message> | void = await CreateEmbed.getMessages(liveChannel);
    if (!messages) return;

    const embed: MessageEmbed = new MessageEmbed()
      .setTitle('Twitch')
      .setTimestamp(Date.now());

    for (const fieldArray of this.#embed) embed.addFields(fieldArray);

    if (messages.toJSON().length === 0) {
      await liveChannel.send({ embeds: [embed] }).catch(console.error);
      return;
    }
    for (const message of messages.toJSON()) {
      if (message.author.id !== DiscordClient._client.user!.id) {
        await message.delete().catch(console.error);
        continue;
      }
      await message.edit({ embeds: [embed] }).catch(console.error);
    }
  }

  public static determineLiveChannel(
    guild: Guild
  ): GuildTextChannel | undefined {
    return guild.channels.cache.find(
      (channel: GuildBasedChannel): boolean =>
        (channel instanceof TextChannel ||
          channel instanceof NewsChannel ||
          channel instanceof ThreadChannel) &&
        channel.name === 'live'
    ) as GuildTextChannel | undefined;
  }

  public static async getMessages(liveChannel: GuildTextChannel): Promise<Collection<string, Message> | void> {
      return liveChannel.messages.fetch().catch(console.error);
  }
}
