import { EmbedBuilder } from '@discordjs/builders';
import {
  TextChannel,
  Message,
  GuildChannel,
  ThreadChannel,
  BaseGuildTextChannel,
  NewsChannel,
  GuildTextBasedChannel,
} from 'discord.js';
import DiscordClient from '../DiscordClient';

/**
 * Adds a quote to discord links
 */
export default class LinkResolve {
  handleCommand(channel: GuildTextBasedChannel, message: Message): void {
    // Extract guild id, channel id and message id from message
    const splitMessage: string = message.content.split(
      /https:\/\/(?:canary\.|ptb\.)?discord(app)?\.(com|gg)\/channels\//
    )[3];
    const properties: string[] = splitMessage.split('/');
    const guild: string = properties[0];
    const urlChannel: string = properties[1];
    const urlMessageString: string = properties[2].substring(0, 18);
    const embed: EmbedBuilder = new EmbedBuilder()
      .setTitle('Quote')
      .setTimestamp(Date.now())
      .setFooter({ text: message.author.tag });
    if (guild !== channel.guild.id) {
      DiscordClient.send(
        channel,
        embed.setDescription('Message not from this server')
      );
      return;
    }
    const guildChannel: GuildChannel | ThreadChannel | undefined =
      channel.guild.channels.cache.find(
        (guildChannel: GuildChannel | ThreadChannel): boolean =>
          guildChannel.id === urlChannel &&
          (guildChannel instanceof TextChannel ||
            guildChannel instanceof NewsChannel ||
            guildChannel instanceof ThreadChannel)
      );
    if (!guildChannel) {
      DiscordClient.send(channel, embed.setDescription('Channel not found'));
      return;
    }
    (guildChannel as BaseGuildTextChannel).messages
      .fetch(urlMessageString)
      .then((urlMessage: Message): void => {
        // Embeds have a character limit of 1024 characters
        if (urlMessage.content.length > 1024)
          urlMessage.content = `${urlMessage.content.substring(0, 1023)}…`;
        const content: string =
          urlMessage.content || 'Message content not available';
        DiscordClient.send(
          channel,
          embed.addFields([
            { name: 'Message Content', value: content, inline: false },
            {
              name: 'Message Author',
              value: `<@${urlMessage.author.id}>`,
              inline: false,
            },
          ])
        );
      })
      .catch(console.error);
  }
}
