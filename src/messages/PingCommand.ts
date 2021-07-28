import Command, { DeploymentOptions, Reply } from './Command';
import {
  CommandInteractionOption,
  Interaction,
  ApplicationCommandData,
} from 'discord.js';

export default class PingCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'ping',
    description: 'Shows the current ping of the bot',
  };
  deploymentOptions: DeploymentOptions = ['dms', 'guilds'];
  
  handleCommand(
    _args: CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    return {
      reply: `My ping is ${Math.floor(
        new Date().getTime() - interaction.createdTimestamp
      )}ms`,
    };
  }
}
