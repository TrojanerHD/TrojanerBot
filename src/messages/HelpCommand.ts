import {
  TextChannel,
  MessageEmbed,
  CommandInteractionOption,
  Interaction,
  ThreadChannel,
  ApplicationCommandData,
  DMChannel,
  Channel,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command, { DeploymentOptions, Reply } from './Command';
import MessageHandler, { ApplicationCommandType } from './MessageHandler';

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
  deploymentOptions: DeploymentOptions = ['guilds', 'dms'];

  #embed?: MessageEmbed;
  #interaction?: Interaction;

  loadHelp(context: 'dms' | 'guilds'): void {
    this.deploy.options![0].choices = [];
    for (const command of MessageHandler._commands.filter((command: Command) =>
      (command.deploymentOptions as ('dms' | 'guilds')[]).includes(context)
    ))
      this.deploy.options![0].choices?.push({
        name: command.deploy.name,
        value: command.deploy.name,
      });
  }

  handleCommand(
    args: CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    this.#interaction = interaction;
    this.#embed = new MessageEmbed()
      .setTimestamp(new Date())
      .setTitle('Help')
      .setColor(206694)
      .setFooter(`Requested by ${interaction.user.tag}`);
    const commands: ApplicationCommandType[] = (
      interaction.inGuild()
        ? interaction.guild?.commands
        : DiscordClient._client.application?.commands
    )!.cache.array();
    if (args.length === 0) {
      for (const command of commands)
        this.#embed.addField(`/${command.name}`, command.description, false);

      return {
        reply: 'See embed',
        afterResponse: this.afterResponse.bind(this),
        ephemeral: true,
      };
    }
    let requestedCommand: string = args[0].value as string;
    const command: ApplicationCommandType | undefined = commands.find(
      (value: ApplicationCommandType) =>
        value.name === requestedCommand || value.name.includes(requestedCommand)
    );
    if (!command)
      return { reply: 'This command does not exist', ephemeral: true };

    this.#embed.addField(`/${command.name}`, command.description, false);
    return {
      reply: 'See embed',
      afterResponse: this.afterResponse.bind(this),
      ephemeral: true,
    };
  }
  private afterResponse(): void {
    let channel: Channel | null = this.#interaction!.channel;
    if (!channel) {
      DiscordClient._client.channels
        .fetch(this.#interaction!.channelID!)
        .then((value: Channel | null) =>
          DiscordClient.send(value! as TextChannel, this.#embed!)
        )
        .catch(console.error);
      return;
    }
    DiscordClient.send(
      channel as TextChannel | ThreadChannel | DMChannel,
      this.#embed!
    );
  }
}
