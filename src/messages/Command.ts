import {
  ApplicationCommandData,
  CommandInteractionOption,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
} from 'discord.js';

export interface Reply {
  reply: string | null | undefined;
  ephemeral?: boolean;
  afterResponse?: () => void;
}

export type DeploymentOptions =
  | ['dms']
  | ['guilds']
  | ['dms', 'guilds']
  | ['guilds', 'dms'];
export default abstract class Command {
  abstract deploy: ApplicationCommandData;
  abstract deploymentOptions: DeploymentOptions;

  abstract handleCommand(
    args: CommandInteractionOption[],
    interaction: Interaction
  ): Reply;
}
