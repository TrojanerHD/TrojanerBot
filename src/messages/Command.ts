import {
  ApplicationCommandData,
  CommandInteractionOption,
  Interaction,
} from 'discord.js';

export interface Reply {
  reply: string | null | undefined;
  ephemeral?: boolean;
  afterResponse?: () => void;
}

export default abstract class Command {
  abstract deploy: ApplicationCommandData;
  guildOnly: boolean = false;

  abstract handleCommand(
    args: CommandInteractionOption[],
    interaction: Interaction
  ): Reply;
}
