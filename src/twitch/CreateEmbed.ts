import {
  MessageEmbed,
  TextChannel,
  Message,
  Collection,
  ThreadChannel,
  NewsChannel,
  GuildBasedChannel,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { GuildTextChannel } from '../messages/Command';

interface StreamInformation {
  name: string;
  title: string;
  category?: string;
  viewer_count: number;
}

interface Field {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Creates the embed for #live
 */
export default class CreateEmbed {
  #embed: Field[][] = [];

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

    const fieldArray: Field[] = [
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
        inline: true,
      });
    this.#embed.push(fieldArray);
  }

  /**
   * Sends the embed into #live
   */
  async sendEmbed(): Promise<void> {
    for (const guild of DiscordClient._client.guilds.cache.toJSON()) {
      const liveChannel: GuildTextChannel | undefined =
        guild.channels.cache.find(
          (channel: GuildBasedChannel): boolean =>
            (channel instanceof TextChannel ||
              channel instanceof NewsChannel ||
              channel instanceof ThreadChannel) &&
            channel.name === 'live'
        ) as GuildTextChannel | undefined;
      if (liveChannel === undefined) continue;

      const messages: Collection<string, Message> | void =
        await liveChannel.messages.fetch().catch(console.error);
      if (!messages) continue;

      const embed: MessageEmbed = new MessageEmbed()
        .setTitle('Twitch')
        .setTimestamp(new Date());

      for (const fieldArray of this.#embed)
        for (const field of fieldArray)
          embed.addField(field.name, field.value, field.inline);

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
  }
}
