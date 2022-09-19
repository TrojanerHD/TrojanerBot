import DiscordClient from '../DiscordClient';
import {
  ApplicationCommand,
  ApplicationCommandData,
  GuildResolvable,
  Message,
  Role,
} from 'discord.js';
import PingCommand from './PingCommand';
import ByeCommand from './ByeCommand';
import LinkCommand from './LinkCommand';
import StreamerCommand from './StreamerCommand';
import DeployCommand from './DeployCommand';
import LinkResolve from './LinkResolve';
import Command from './Command';
import CommandPermissions from './permissions/CommandPermissions';
import Settings from '../Settings';

export type ApplicationCommandType = ApplicationCommand<{
  guild: GuildResolvable;
}>;

export interface CommandHandler {
  command: string | string[];
  handler: Command;
}

export default class MessageHandler {
  /**
   * All active commands
   */
  static _commands: Command[] = [
    new PingCommand(),
    new ByeCommand(),
    new LinkCommand(),
    new StreamerCommand(),
    new DeployCommand(),
  ];

  constructor() {
    DiscordClient._client.on('messageCreate', this.onMessage.bind(this));
  }

  /**
   * Deploys all commands on all servers and for DMs
   */
  public static addCommands(): void {
    const guildCommands: ApplicationCommandData[] = MessageHandler._commands
      .filter((command: Command): boolean => command.guildOnly)
      .map((command: Command): ApplicationCommandData => command.deploy);

    const dmCommands: ApplicationCommandData[] = MessageHandler._commands
      .filter((command: Command): boolean => !command.guildOnly)
      .map((command: Command): ApplicationCommandData => command.deploy);

    DiscordClient._client.application?.commands.set(dmCommands);

    for (const guild of DiscordClient._client.guilds.cache.toJSON()) {
      guild.commands
        .fetch()
        .then((): void => {
          const commandPermissions: CommandPermissions =
            new CommandPermissions();
          guild.commands
            .set(guildCommands)
            .then(commandPermissions.onCommandsSet.bind(commandPermissions))
            .catch(console.error);
        })
        .catch(console.error);
    }
  }

  /**
   * Checks for `!deploy` message to deploy the commands
   * Also checks for a message link in the message that could be processed as quote
   * @param message The message to be processed
   */
  onMessage(message: Message): void {
    if (message.channel.type === 'DM' || message.author.bot) return;
    if (
      !Settings.settings['disable-quote-replies'] &&
      message.content.match(/https:\/\/discord(app)?\.(com|gg)\/channels/)
    )
      new LinkResolve().handleCommand(message.channel, message);

    if (message.content === '!deploy') {
      if (
        !message.member!.roles.cache.some((role: Role): boolean =>
          Settings.settings['permission-roles'].includes(role.name)
        )
      ) {
        message
          .reply({
            content: 'You do not have the permission to perform this command',
            allowedMentions: { repliedUser: false },
          })
          .catch(console.error);
        return;
      }
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
