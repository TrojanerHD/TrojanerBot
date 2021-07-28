import {
  TextChannel,
  Message,
  GuildChannel,
  MessageEmbed,
  ThreadChannel,
  Snowflake,
} from 'discord.js';
import DiscordClient from '../DiscordClient';

export default class LinkResolve {
  handleCommand(channel: TextChannel, message: Message): void {
    const splitMessage: string = message.content.split(
      /https:\/\/discord(app)?\.(com|gg)\/channels\//
    )[3];
    const properties: string[] = splitMessage.split('/');
    const guild: string = properties[0];
    const urlChannel: string = properties[1];
    const urlMessageString: Snowflake = properties[2] as Snowflake;
    const embed: MessageEmbed = new MessageEmbed()
      .setTitle('Quote')
      .setTimestamp(new Date())
      .setFooter(message.author.tag);
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
          guildChannel.id === urlChannel && guildChannel.type === 'text'
      );
    if (!guildChannel) {
      DiscordClient.send(channel, embed.setDescription('Channel not found'));
      return;
    }
    (<TextChannel>guildChannel).messages
      .fetch(urlMessageString)
      .then((urlMessage: Message) => {
        if (urlMessage.content === '') return;
        if (urlMessage.content.length > 1024)
          urlMessage.content = `${urlMessage.content.substring(0, 1023)}…`;
        DiscordClient.send(
          channel,
          embed
            .addField('Message Content', urlMessage.content, false)
            .addField('Message Author', `<@${urlMessage.author.id}>`, false)
        );
      });
  }
}
