import Command, { GuildTextChannel, Reply } from './Command';
import {
  TextChannel,
  Message,
  GuildChannel,
  MessageEmbed,
  ThreadChannel,
  CommandInteractionOption,
  Interaction,
  NewsChannel,
  ChatInputApplicationCommandData,
} from 'discord.js';
import DiscordClient from '../DiscordClient';

export default class LinkCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
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
  guildOnly = true;

  #channel?: GuildTextChannel;
  #newChannel?: GuildTextChannel;
  #embed?: MessageEmbed;
  #oldMessage?: Message;
  #author?: string;

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    this.#newChannel = interaction.guild?.channels.cache.find(
      (channel: GuildChannel | ThreadChannel): boolean =>
        (channel instanceof TextChannel ||
          channel instanceof NewsChannel ||
          channel instanceof ThreadChannel) &&
        channel.id === args[0].value
    ) as GuildTextChannel;

    this.#author = interaction.user.id;
    this.#channel = interaction.channel! as GuildTextChannel;
    if (!this.#newChannel || this.#newChannel.id === this.#channel.id)
      return { reply: 'Please specify a different channel', ephemeral: true };
    this.#embed = new MessageEmbed()
      .setTitle(
        `${this.channelName(
          this.#channel
        )} -> <:portal_blue:631237086988599317>`
      )
      .setDescription(
        `To ${this.channelName(this.#newChannel)}\nRequested by <@${
          this.#author
        }>`
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

  private sendMessageToNewChannel(message: Message): void {
    this.#oldMessage = message;
    DiscordClient.send(
      this.#newChannel!,
      new MessageEmbed()
        .setTitle(
          `<:portal_orange:631237087022022656> -> ${this.channelName(
            this.#newChannel
          )}`
        )
        .setDescription(
          `[From ${this.channelName(this.#channel)}](${
            message.url
          })\nRequested by <@${this.#author}>`
        )
        .setTimestamp(new Date())
        .setColor(16285727),
      this.editOldMessage.bind(this)
    );
  }

  editOldMessage(message: Message): void {
    this.#embed!.setDescription(
      this.#embed!.description!.replace(/(To.*$)/m, `[$1](${message.url})`)
    );
    this.#oldMessage!.edit({ embeds: [this.#embed!] }).catch(console.error);
  }

  private channelName(channel?: GuildTextChannel): string {
    if (!channel) return 'Not available';
    return `${channel instanceof TextChannel ? '#' : ''}${channel.name}`;
  }
}
