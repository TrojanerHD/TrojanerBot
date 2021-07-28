import Command, { DeploymentOptions, Reply } from './Command';
import {
  TextChannel,
  Message,
  GuildChannel,
  MessageEmbed,
  ThreadChannel,
  ApplicationCommandData,
  CommandInteractionOption,
  Interaction,
} from 'discord.js';
import DiscordClient from '../DiscordClient';

export default class LinkCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'to',
    description:
      'Sends a message that the current conversation should be moved to the specified channel',
    options: [
      {
        type: 7,
        name: 'channel',
        description: 'Channel where the conversation will be linked to',
        required: true,
      },
    ],
  };
  deploymentOptions: DeploymentOptions = ['guilds'];
  #channel?: TextChannel | ThreadChannel;
  #newChannel?: TextChannel | ThreadChannel;
  #embed?: MessageEmbed;
  #oldMessage?: Message;
  #author?: string;

  handleCommand(
    args: CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    this.#newChannel = interaction.guild?.channels.cache.find(
      (channel: GuildChannel | ThreadChannel): boolean =>
        channel.type === 'text' && channel.id === args[0].value
    ) as TextChannel | ThreadChannel;

    this.#author = interaction.user.id;
    this.#channel = interaction.channel! as TextChannel | ThreadChannel;
    if (!this.#newChannel || this.#newChannel.id === this.#channel.id)
      return { reply: 'Please specify a different channel', ephemeral: true };
    this.#embed = new MessageEmbed()
      .setTitle(`#${this.#channel.name} -> <:portal_blue:631237086988599317>`)
      .setDescription(
        `To #${this.#newChannel.name}\nRequested by <@${this.#author}>`
      )
      .setTimestamp(new Date())
      .setColor(4176616);

    DiscordClient.send(
      this.#channel,
      this.#embed,
      this.sendMessageToNewChannel.bind(this)
    );
    return { reply: 'See embed', ephemeral: true };
  }

  private sendMessageToNewChannel(message: Message) {
    this.#oldMessage = message;
    DiscordClient.send(
      this.#newChannel!,
      new MessageEmbed()
        .setTitle(
          `<:portal_orange:631237087022022656> -> #${this.#newChannel!.name}`
        )
        .setDescription(
          `[From #${this.#channel!.name}](${message.url})\nRequested by <@${
            this.#author
          }>`
        )
        .setTimestamp(new Date())
        .setColor(16285727),
      this.editOldMessage.bind(this)
    );
  }

  editOldMessage(message: Message) {
    this.#embed!.setDescription(
      this.#embed!.description!.replace(/(To.*$)/m, `[$1](${message.url})`)
    );
    this.#oldMessage!.edit({ embeds: [this.#embed!] }).catch(console.error);
  }
}
