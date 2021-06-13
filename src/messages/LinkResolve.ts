import Command from './Command';
import { TextChannel, Message, GuildChannel, MessageEmbed } from 'discord.js';

export default class LinkResolve extends Command {
  helpInfo: {name: string, value: string} = {name: '', value: 'Resolves message links and embeds them as Discord should have done it'};

  handleCommand(args: string[], channel: TextChannel, message: Message): void {
    const splitMessage: string = message.content.split(
      /https:\/\/discord(app)?\.(com|gg)\/channels\//
    )[1];
    const properties: string[] = splitMessage.split('/');
    const guild: string = properties[0];
    const urlChannel: string = properties[1];
    const urlMessageString: string = properties[2];
    const embed: MessageEmbed = new MessageEmbed()
      .setTitle('Quote')
      .setTimestamp(new Date())
      .setFooter(message.author.tag);
    if (guild !== channel.guild.id) {
      channel
        .send(embed.setDescription('Message not from this server'))
        .catch(console.error);
      return;
    }
    const guildChannel:
      | GuildChannel
      | undefined = channel.guild.channels.cache.find(
      (guildChannel: GuildChannel) =>
        guildChannel.id === urlChannel && guildChannel.type === 'text'
    );
    if (!guildChannel) {
      channel
        .send(embed.setDescription('Channel not found'))
        .catch(console.error);
      return;
    }
    (<TextChannel>guildChannel).messages
      .fetch(urlMessageString)
      .then((urlMessage: Message) => {
        if (urlMessage.content === '') return;
        if (urlMessage.content.length > 1024) urlMessage.content = `${urlMessage.content.substring(0, 1023)}…`;
        channel
          .send(
            embed
              .addField('Message Content', urlMessage.content, false)
              .addField('Message Author', `<@${urlMessage.author.id}>`, false)
          )
          .catch(console.error);
      });
  }
}
