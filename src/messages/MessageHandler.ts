import DiscordClient from '../DiscordClient';
import {
  ApplicationCommand,
  ApplicationCommandManager,
  GuildResolvable,
  Interaction,
  Message,
} from 'discord.js';
import PingCommand from './PingCommand';
import ByeCommand from './ByeCommand';
import LinkCommand from './LinkCommand';
import HelpCommand from './HelpCommand';
import StreamerCommand from './StreamerCommand';
import DeployCommand from './DeployCommand';
import LinkResolve from './LinkResolve';
import Command, { Reply } from './Command';
import RegisterCommand from './RegisterCommand';
import PermissionManager from '../PermissionManager';

export type ApplicationCommandType = ApplicationCommand<{
  guild: GuildResolvable;
}>;
export interface CommandHandler {
  command: string | string[];
  handler: Command;
}

export default class MessageHandler {
  static _commands: Command[] = [
    new PingCommand(),
    new ByeCommand(),
    new LinkCommand(),
    new StreamerCommand(),
    new HelpCommand(),
    new DeployCommand(),
  ];

  constructor() {
    DiscordClient._client.on('message', this.onMessage.bind(this));
    DiscordClient._client.on('interaction', this.onReaction.bind(this));
  }

  public static addCommands(): void {
    for (const command of MessageHandler._commands) {
      const deploymentOptions: ('dms' | 'guilds')[] = command.deploymentOptions;
      if (deploymentOptions.includes('dms')) {
        if (command.deploy.name === 'help')
          (command as HelpCommand).loadHelp('dms');
        const commandHandler: ApplicationCommandManager | undefined =
          DiscordClient._client.application?.commands;

        const registerCommand: RegisterCommand = new RegisterCommand(command);
        commandHandler
          ?.fetch()
          .then(registerCommand.addCommand.bind(registerCommand))
          .catch(console.error);
      }

      if (deploymentOptions.includes('guilds')) {
        if (command.deploy.name === 'help')
          (command as HelpCommand).loadHelp('guilds');
        for (const guild of DiscordClient._client.guilds.cache.array()) {
          const registerCommand: RegisterCommand = new RegisterCommand(
            command,
            guild
          );
          guild.commands
            .fetch()
            .then(registerCommand.addCommand.bind(registerCommand))
            .catch(console.error);
        }
      }
    }
  }

  private onReaction(interaction: Interaction): void {
    if (!interaction.isCommand()) return;
    for (const command of MessageHandler._commands)
      if (command.deploy.name === interaction.commandName) {
        const reply: Reply = command.handleCommand(
          interaction.options.array(),
          interaction
        );
        if (!reply.ephemeral) reply.ephemeral = false;
        if (!reply.afterResponse) reply.afterResponse = (): void => {};
        interaction
          .reply({ content: reply.reply, ephemeral: reply.ephemeral })
          .then(reply.afterResponse.bind(command))
          .catch(console.error);
      }
  }

  onMessage(message: Message) {
    if (message.channel.type !== 'text' || message.author.bot) return;
    if (message.content.match(/https:\/\/discord(app)?\.(com|gg)\/channels/))
      new LinkResolve().handleCommand(message.channel, message);

    if (
      PermissionManager.hasPermission(message.guild!, message.member?.roles) &&
      message.content === '!deploy'
    ) {
      MessageHandler.addCommands();
      message
        .reply({
          content: 'Commands deployed',
          allowedMentions: { repliedUser: false },
        })
        .catch(console.error);
    }
  }
}
