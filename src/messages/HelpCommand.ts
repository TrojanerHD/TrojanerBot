import {
  MessageEmbed,
  CommandInteractionOption,
  Interaction,
  ApplicationCommandData,
  Channel,
  ApplicationCommandOptionChoice,
  TextBasedChannels,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command, { Reply } from './Command';
import MessageHandler from './MessageHandler';

export default class HelpCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'help',
    description:
      'Displays help info for the specified command if there was a command specified',
    options: [
      {
        type: 3,
        name: 'command',
        description: 'The command to display help for',
        required: false,
        choices: [],
      },
    ],
  };

  #embed?: MessageEmbed;
  #interaction?: Interaction;

  loadHelp(): void {
    this.deploy.options![0].choices = MessageHandler._commands.map(
      (command: Command): ApplicationCommandOptionChoice => ({
        name: command.deploy.name,
        value: command.deploy.name,
      })
    );
  }

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    this.#interaction = interaction;

    const commands: ApplicationCommandData[] = MessageHandler._commands.map(
      (command: Command): ApplicationCommandData => command.deploy
    );
    if (args.length === 0) {
      this.#embed = new MessageEmbed()
        .setTimestamp(new Date())
        .setTitle('Help')
        .setColor(206694)
        .setFooter(`Requested by ${interaction.user.tag}`);
      for (const command of commands)
        this.#embed.addField(`/${command.name}`, command.description, false);

      return {
        reply: 'See embed',
        afterResponse: this.afterResponse.bind(this),
        ephemeral: true,
      };
    }
    let requestedCommand: string = args[0].value as string;
    const command: ApplicationCommandData | undefined = commands.find(
      (command: ApplicationCommandData): boolean =>
        command.name === requestedCommand ||
        command.name.includes(requestedCommand)
    );
    if (!command)
      return { reply: 'This command does not exist', ephemeral: true };

    return {
      reply: `**/${command.name}**: ${command.description}`,
      ephemeral: true,
    };
  }

  private afterResponse(): void {
    let channel: TextBasedChannels | null = this.#interaction!.channel;
    if (!channel) {
      DiscordClient._client.channels
        .fetch(this.#interaction!.channelId!)
        .then((value: Channel | null) =>
          DiscordClient.send(value! as TextBasedChannels, this.#embed!)
        )
        .catch(console.error);
      return;
    }
    DiscordClient.send(channel as TextBasedChannels, this.#embed!);
  }
}
