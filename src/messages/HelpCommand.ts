import {
  MessageEmbed,
  CommandInteractionOption,
  ApplicationCommandData,
  ApplicationCommandOptionChoice,
  ChatInputApplicationCommandData,
  ApplicationCommandChoicesData,
  CommandInteraction,
} from 'discord.js';
import Command from './Command';
import MessageHandler from './MessageHandler';

export default class HelpCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
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

  loadHelp(): void {
    (this.deploy.options![0] as ApplicationCommandChoicesData).choices =
      MessageHandler._commands.map(
        (command: Command): ApplicationCommandOptionChoice => ({
          name: command.deploy.name,
          value: command.deploy.name,
        })
      );
  }

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): void {
    const commands: ChatInputApplicationCommandData[] =
      MessageHandler._commands.map(
        (command: Command): ChatInputApplicationCommandData => command.deploy
      );
    if (args.length === 0) {
      const embed: MessageEmbed = new MessageEmbed()
        .setTimestamp(new Date())
        .setTitle('Help')
        .setColor(206694)
        .setFooter({ text: `Requested by ${interaction.user.tag}` });
      for (const command of commands)
        embed.addField(`/${command.name}`, command.description, false);

      interaction
        .reply({
          embeds: [embed],
          ephemeral: true,
        })
        .catch(console.error);
      return;
    }
    let requestedCommand: string = args[0].value as string;
    const command: ApplicationCommandData | undefined = commands.find(
      (command: ApplicationCommandData): boolean =>
        command.name === requestedCommand ||
        command.name.includes(requestedCommand)
    );
    if (!command) {
      interaction
        .reply({ content: 'This command does not exist', ephemeral: true })
        .catch(console.error);
      return;
    }

    interaction
      .reply({
        content: `**/${command.name}**: ${command.description}`,
        ephemeral: true,
      })
      .catch(console.error);
  }
}
