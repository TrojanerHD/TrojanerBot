import DiscordClient from '../DiscordClient';
import {
  ApplicationCommand,
  ApplicationCommandData,
  Collection,
  Guild,
  GuildResolvable,
  Message,
} from 'discord.js';
import PingCommand from './PingCommand';
import ByeCommand from './ByeCommand';
import LinkCommand from './LinkCommand';
import StreamerCommand from './StreamerCommand';
import RolesCommand from './RolesCommand';
import PermitCommand from './PermitCommand';
import StreamChannelCommand from './StreamChannelCommand';
import LinkResolve from './LinkResolve';
import Command from './Command';
import CommandPermissions from './permissions/CommandPermissions';

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
    new RolesCommand(),
    new PermitCommand(),
    new StreamChannelCommand(),
  ];

  constructor() {
    DiscordClient._client.on('messageCreate', this.onMessage.bind(this));
  }

  /**
   * Deploys all commands on all servers and for DMs
   */
  public static addCommands(guild?: Guild): void {
    const commands: ApplicationCommandData[] = MessageHandler._commands.map(
      (command: Command): ApplicationCommandData => command.deploy
    );

    if (DiscordClient._client.application === undefined) return;

    const setCommands: Promise<
      Collection<string, ApplicationCommand<{ guild: GuildResolvable }>>
    > = DiscordClient._client.application!.commands.set(commands);

    if (guild !== undefined) {
      const commandPermissions: CommandPermissions = new CommandPermissions(
        guild
      );
      setCommands.then(
        commandPermissions.onCommandsSet.bind(commandPermissions)
      );
    }

    setCommands.catch(console.error);
  }

  /**
   * Checks for a message link in the message that could be processed as quote
   * @param message The message to be processed
   */
  onMessage(message: Message): void {
    if (message.channel.type === 'DM' || message.author.bot) return;
    if (message.content.match(/https:\/\/discord(app)?\.(com|gg)\/channels/))
      new LinkResolve().handleCommand(message.channel, message);
  }
}
