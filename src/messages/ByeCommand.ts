import Command, { Reply } from './Command';
import { ChatInputApplicationCommandData } from 'discord.js';
import DiscordClient from '../DiscordClient';

export default class ByeCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'bye',
    description: 'Shuts the bot down',
    defaultPermission: false,
  };
  guildOnly: boolean = true;

  handleCommand(): Reply {
    return {
      reply:
        '**JavaScript**\n:robot: Bleeb Bloob :robot:\n:robot: Bleeb Blooouuub…\n[Shutting down]',
      afterResponse: ByeCommand.destroyBot,
    };
  }

  private static destroyBot(): void {
    DiscordClient._client.destroy();
    process.exit(0);
  }
}
