import { TextChannel, Message } from 'discord.js';

export default abstract class Command {
  abstract helpInfo: {name: string, value: string};
  abstract handleCommand(
    args: string[],
    channel: TextChannel,
    message: Message
  ): void;
}
