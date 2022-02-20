import {
  ChatInputApplicationCommandData,
  Collection,
  CommandInteractionOption,
  Snowflake,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command, { Reply } from './Command';
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

  handleCommand(args: readonly CommandInteractionOption[]): Reply {
    switch (args[0].name) {
      case 'all':
        MessageHandler.addCommands();
        return { reply: 'All commands have been added', ephemeral: true };
      case 'remove':
        DiscordClient._client.application?.commands
          .fetch()
          .then(this.commandsFetched);

        for (const guild of DiscordClient._client.guilds.cache.toJSON())
          guild.commands.fetch().then(this.commandsFetched);
        return { reply: 'All commands have been removed', ephemeral: true };
      default:
        return { reply: 'Something went wrong', ephemeral: true };
    }
  }

  private commandsFetched(
    commands: Collection<Snowflake, ApplicationCommandType>
  ) {
    for (const command of commands.toJSON())
      command.delete().catch(console.error);
  }
}
