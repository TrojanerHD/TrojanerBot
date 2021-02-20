import Command from './Command';
import { TextChannel, Message } from 'discord.js';
import PermissionManager from '../PermissionManager';
import { DiscordClient } from '../DiscordClient';

export default class ByeCommand extends Command {
  helpInfo: { name: string; value: string } = {
    name: 'bye|stop',
    value: 'Shuts the bot down',
  };

  handleCommand(args: string[], channel: TextChannel, message: Message): void {
    if (
      !PermissionManager.hasPermission(
        channel,
        message,
        message.member?.roles.cache.array()
      )
    )
      return;
    message.channel
      .send(
        '**JavaScript**\n:robot: Bleeb Bloob :robot:\n:robot: Bleeb Blooouuub...\n[Shutting down]'
      )
      .then(ByeCommand.destroyBot)
      .catch(console.error);
  }
  private static destroyBot(): void {
    DiscordClient._client.destroy();
    process.exit(0);
  }
}
