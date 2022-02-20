import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOption,
  NewsChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

export type GuildTextChannel = TextChannel | NewsChannel | ThreadChannel;

export default abstract class Command {
  abstract deploy: ChatInputApplicationCommandData;
  guildOnly: boolean = false;

  abstract handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): void;
}
