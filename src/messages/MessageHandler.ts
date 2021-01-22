import { DiscordClient } from '../DiscordClient';
import { Message } from 'discord.js';
import PingCommand from './PingCommand';
import ByeCommand from './ByeCommand';
import LinkCommand from './LinkCommand';
import HelpCommand from './HelpCommand';
import StreamerCommand from './StreamerCommand';
import MessageDeletion from './MessageDeletion';
import LinkResolve from './LinkResolve';
import Command from './Command';
import Settings from '../Settings';

export interface CommandHandler {
  command: string | string[];
  handler: Command;
}

export default class MessageHandler {
  static _commands: CommandHandler[] = [
    { command: 'ping', handler: new PingCommand() },
    { command: ['bye', 'stop'], handler: new ByeCommand() },
    { command: ['link', 'to'], handler: new LinkCommand() },
    { command: 'streamer', handler: new StreamerCommand() },
    { command: 'help', handler: new HelpCommand() },
  ];

  constructor() {
    DiscordClient._client.on('message', this.onMessage.bind(this));
  }

  onMessage(message: Message) {
    if (message.channel.type !== 'text') return;
    if (message.content.match(/https:\/\/discordapp.com\/channels/)) {
      new LinkResolve().handleCommand([], message.channel, message);
    }
    if (!message.content.startsWith(Settings.getSettings().prefix)) return;
    const args: string[] = message.content.split(' ');
    let userCommand: string | undefined = args.shift();
    if (!userCommand) return;
    userCommand = userCommand.substr(1, userCommand.length)
    for (const command of MessageHandler._commands) {
      if (
        typeof command.command === 'string' ||
        command.command instanceof String
      ) {
        if (command.command === userCommand) {
          command.handler.handleCommand(args, message.channel, message);
          return;
        }
      } else
        for (const commandName of command.command)
          if (commandName === userCommand) {
            command.handler.handleCommand(args, message.channel, message);
            return;
          }
    }

    const messageDeletion: MessageDeletion = new MessageDeletion(message);
    message.channel
      .send('This command does not exist')
      .then(messageDeletion.checkDeletion.bind(messageDeletion))
      .catch(console.error);
  }
}
