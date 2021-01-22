import {
  MessageEmbed,
  GuildChannel,
  TextChannel,
  Snowflake,
  Message,
  Collection,
} from 'discord.js';
import { DiscordClient } from '../DiscordClient';
import Settings from '../settings';

interface StreamInformation {
  name: string;
  title: string;
  game?: string;
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
  private _embed: Field[][] = [];

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
    if (streamInformation.game !== undefined)
      fieldArray.push({
        name: 'Game',
        value: streamInformation.game,
        inline: true,
      });
    this._embed.push(fieldArray);
  }

  /**
   * Sends the embed into #live
   */
  sendEmbed(): void {
    for (const guild of DiscordClient._client.guilds.cache.array()) {
      const liveChannel:
        | GuildChannel
        | undefined = guild.channels.cache
        .array()
        .find(
          (channel: GuildChannel) =>
            channel.type === 'text' && channel.name === 'live'
        );
      if (!liveChannel) continue;

      (<TextChannel>liveChannel).messages
        .fetch()
        .then(this.messagesFetched.bind(this))
        .catch(console.error);
    }
  }

  /**
   * Callback for the fetch request in the #live channel. Deletes all messages in #live that do not belong there
   * @param messages The fetched messages
   */
  private messagesFetched(messages: Collection<Snowflake, Message>): void {
    const embed: MessageEmbed = new MessageEmbed()
      .setTitle('Twitch')
      .setTimestamp(new Date());

    this._embed.sort((a: Field[], b: Field[]) => {
      for (const streamer of Settings.getSettings().streamers) {
        if (a[0].value.split('[')[1].split(']')[0] === streamer) return -1;
        if (b[0].value.split('[')[1].split(']')[0] === streamer) return 1;
      }
      return 0;
    });
    for (const fieldArray of this._embed) {
      if (embed.fields.length !== 0) embed.addField('\u200b', '\u200b', false);
      for (const field of fieldArray)
        embed.addField(field.name, field.value, field.inline);
    }
    for (const message of messages.array()) {
      if (message.author.id !== DiscordClient._client.user!.id) {
        message.delete().catch(console.error);
        continue;
      }
      message.edit('').catch(console.error);
      message.edit(embed).catch(console.error);
    }
  }
}
