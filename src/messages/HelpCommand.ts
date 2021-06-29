import { TextChannel, Message, MessageEmbed } from 'discord.js';
import { DiscordClient } from '../DiscordClient';
import Settings from '../Settings';
import Command from './Command';
import MessageHandler, { CommandHandler } from './MessageHandler';

export default class HelpCommand extends Command {
  helpInfo: { name: string; value: string } = {
    name: 'help [command]',
    value:
      'Displays help info for the specified command if there was a command specified. Otherwise it will display help for all commands',
  };

  handleCommand(args: string[], channel: TextChannel, message: Message): void {
    const embed: MessageEmbed = new MessageEmbed()
      .setTimestamp(new Date())
      .setTitle('Help')
      .setColor('153c52')
      .setFooter(`Requested by ${message.author.tag}`);
    if (args.length === 0) {
      for (const command of MessageHandler._commands)
        embed.addField(
          `${Settings.getSettings().prefix}${command.handler.helpInfo.name}`,
          command.handler.helpInfo.value,
          false
        );
      DiscordClient.send(channel, embed);
      return;
    }
    let requestedCommand = args[0];
    if (requestedCommand.startsWith('!'))
      requestedCommand = requestedCommand.substr(1, requestedCommand.length);
    const command: CommandHandler | undefined = MessageHandler._commands.find(
      (value: CommandHandler) =>
        value.command === requestedCommand ||
        value.command.includes(requestedCommand)
    );
    if (!command) {
      DiscordClient.send(channel, 'This command does not exist');
      return;
    }
    embed.addField(
      `${Settings.getSettings().prefix}${command.handler.helpInfo.name}`,
      command.handler.helpInfo.value,
      false
    );
    DiscordClient.send(channel, embed);
  }
}
