import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOption,
  NewsChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

/**
 * Any channel with text
 */
export type GuildTextChannel = TextChannel | NewsChannel | ThreadChannel;

/**
 * An abstract command handler class
 */
export default abstract class Command {
  /**
   * The deploy data of the command
   */
  abstract deploy: ChatInputApplicationCommandData;

  /**
   * Fires every time a user executes a registered command
   * @param args Arguments of the slash command
   * @param interaction The whole interaction in case something more complex than just the arguments is required
   */
  abstract handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): void;
}
