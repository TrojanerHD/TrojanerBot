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

  async handleCommand(
    _args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): Promise<void> {
    try {
      await interaction.reply(
        '**JavaScript**\n:robot: Bleeb Bloob :robot:\n:robot: Bleeb Blooouuub…\n[Shutting down]'
      );
      DiscordClient._client.destroy();
      process.exit(0);
    } catch (err: any) {
      console.error(err);
    }
  }
}
