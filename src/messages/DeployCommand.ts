import {
  ChatInputApplicationCommandData,
  Collection,
  CommandInteraction,
  CommandInteractionOption,
  Snowflake,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command from './Command';
import MessageHandler, { ApplicationCommandType } from './MessageHandler';

export default class DeployCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'deploy',
    description: 'Deploys the custom commands',
    options: [
      {
        type: 1,
        name: 'all',
        description: 'Deploys the custom commands',
        options: [],
      },
      {
        type: 1,
        name: 'remove',
        description: 'Removes the deployed commands',
        options: [],
      },
    ],
    defaultPermission: false,
  };

  guildOnly: boolean = true;

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): void {
    switch (args[0].name) {
      case 'all':
        MessageHandler.addCommands();
        interaction
          .reply({
            content: 'All commands have been added',
            ephemeral: true,
          })
          .catch(console.error);
        break;
      case 'remove':
        DiscordClient._client.application?.commands
          .fetch()
          .then(this.commandsFetched)
          .catch(console.error);

        for (const guild of DiscordClient._client.guilds.cache.toJSON())
          guild.commands
            .fetch()
            .then(this.commandsFetched)
            .catch(console.error);

        interaction
          .reply({
            content: 'All commands have been removed',
            ephemeral: true,
          })
          .catch(console.error);
        break;
      default:
        interaction
          .reply({ content: 'Something went wrong', ephemeral: true })
          .catch(console.error);
        break;
    }
  }

  private commandsFetched(
    commands: Collection<Snowflake, ApplicationCommandType>
  ): void {
    for (const command of commands.toJSON())
      command.delete().catch(console.error);
  }
}
