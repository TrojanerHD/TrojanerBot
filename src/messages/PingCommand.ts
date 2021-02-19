import Command from './Command';
import { TextChannel, MessageEmbed, Message } from 'discord.js';

export default class PingCommand extends Command {
  helpInfo: { name: string; value: string } = {
    name: 'ping',
    value: 'Shows the current ping of the bot',
  };
  handleCommand(args: string[], channel: TextChannel, message: Message): void {
    channel
      .send(
        new MessageEmbed()
          .setDescription('Ping')
          .setAuthor('JavaScript')
          .setColor('153c52')
          .addField(
            'My ping is',
            `${Math.floor(new Date().getTime() - message.createdTimestamp)}ms`
          )
          .setFooter(`Requested by ${message.author.tag}`)
          .setTimestamp(new Date())
      )
      .catch(console.error);
  }
}
