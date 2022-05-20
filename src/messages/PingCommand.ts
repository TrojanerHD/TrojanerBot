import Command from './Command';
import {
  CommandInteractionOption,
  ChatInputApplicationCommandData,
  CommandInteraction,
} from 'discord.js';

export default class PingCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'ping',
    description: 'Shows the current ping of the bot',
  };

  handleCommand(
    _args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): void {
    interaction
      .reply(
        `My ping is ${Math.floor(
          new Date().getTime() - interaction.createdTimestamp
        )}ms`
      )
      .catch(console.error);
  }
}
