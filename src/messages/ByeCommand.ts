import Command from './Command';
import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOption,
} from 'discord.js';
import DiscordClient from '../DiscordClient';

export default class ByeCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'bye',
    description: 'Shuts the bot down',
    defaultPermission: false,
  };
  guildOnly: boolean = true;

  handleCommand(
    _args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): void {
    interaction
      .reply(
        '**JavaScript**\n:robot: Bleeb Bloob :robot:\n:robot: Bleeb Blooouuub…\n[Shutting down]'
      )
      .then(ByeCommand.destroyBot)
      .catch(console.error);
  }

  private static destroyBot(): void {
    DiscordClient._client.destroy();
    process.exit(0);
  }
}
