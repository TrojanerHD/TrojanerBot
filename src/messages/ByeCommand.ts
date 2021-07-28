import Command, { DeploymentOptions, Reply } from './Command';
import {
  TextChannel,
  Message,
  CommandInteractionOption,
  ApplicationCommandData,
  InteractionReplyOptions,
  MessagePayload,
  MessageEmbed,
  Interaction,
} from 'discord.js';
import PermissionManager from '../PermissionManager';
import DiscordClient from '../DiscordClient';

export default class ByeCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'bye',
    description: 'Shuts the bot down',
  };
  deploymentOptions: DeploymentOptions = ['guilds'];

  handleCommand(
    _args: CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    if (
      !PermissionManager.hasPermission(
        interaction.guild!,
        interaction.member!.roles
      )
    )
      return { reply: PermissionManager._errorMessage };
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
