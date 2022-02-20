import Command, { Reply } from './Command';
import {
  CommandInteractionOption,
  Interaction,
  ChatInputApplicationCommandData,
} from 'discord.js';

export default class PingCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'ping',
    description: 'Shows the current ping of the bot',
  };

  handleCommand(
    _args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    return {
      reply: `My ping is ${Math.floor(
        new Date().getTime() - interaction.createdTimestamp
      )}ms`,
    };
  }
}
