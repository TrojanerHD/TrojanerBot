import Command, { GuildTextChannel } from './Command';
import {
  TextChannel,
  Message,
  GuildChannel,
  MessageEmbed,
  ThreadChannel,
  CommandInteractionOption,
  NewsChannel,
  ChatInputApplicationCommandData,
  CommandInteraction,
  DMChannel,
  PartialDMChannel,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { APIMessage } from 'discord-api-types';

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

  #newChannel?: GuildTextChannel;
  #embed?: MessageEmbed;
  #oldMessage?: Message;
  #author?: string;

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): void {
    this.#newChannel = interaction.guild?.channels.cache.find(
      (channel: GuildChannel | ThreadChannel): boolean =>
        (channel instanceof TextChannel ||
          channel instanceof NewsChannel ||
          channel instanceof ThreadChannel) &&
        channel.id === args[0].value
    ) as GuildTextChannel;

    this.#author = interaction.user.id;
    if (!this.#newChannel || this.#newChannel.id === interaction.channelId) {
      interaction
        .reply({
          content: 'Please specify a different channel',
          ephemeral: true,
        })
        .catch(console.error);
      return;
    }
    this.#embed = new MessageEmbed()
      .setTitle(
        `${this.channelName(
          interaction.channel!
        )} -> <:portal_blue:631237086988599317>`
      )
      .setDescription(
        `To ${this.channelName(this.#newChannel)}\nRequested by <@${
          this.#author
        }>`
      )
      .setTimestamp(new Date())
      .setColor(4176616);

    interaction
      .reply({ embeds: [this.#embed], fetchReply: true })
      .then(this.sendMessageToNewChannel.bind(this))
      .catch(console.error);
  }

  private sendMessageToNewChannel(
    message: APIMessage | Message<boolean>
  ): void {
    this.#oldMessage = message as Message;
    DiscordClient.send(
      this.#newChannel!,
      new MessageEmbed()
        .setTitle(
          `<:portal_orange:631237087022022656> -> ${this.channelName(
            this.#newChannel
          )}`
        )
        .setDescription(
          `[From ${this.channelName(this.#oldMessage.channel)}](${
            this.#oldMessage.url
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

  private channelName(
    channel?: GuildTextChannel | DMChannel | PartialDMChannel
  ): string {
    if (!channel) return 'Not available';
    return `${channel instanceof TextChannel ? '#' : ''}${
      (channel as GuildTextChannel).name
    }`;
  }
}
