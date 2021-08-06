import {
  ApplicationCommandData,
  CommandInteractionOption,
  Interaction,
  NewsChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

export interface Reply {
  reply: string | null | undefined;
  ephemeral?: boolean;
  afterResponse?: () => void;
}
export type GuildTextChannel = TextChannel | NewsChannel | ThreadChannel;

export default abstract class Command {
  abstract deploy: ApplicationCommandData;
  guildOnly: boolean = false;

  abstract handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply;
}
