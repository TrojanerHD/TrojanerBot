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
  GuildCacheMessage,
} from 'discord.js';

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

  async handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): Promise<void> {
    const newChannel: GuildTextChannel | undefined =
      interaction.guild?.channels.cache.find(
        (channel: GuildChannel | ThreadChannel): boolean =>
          (channel instanceof TextChannel ||
            channel instanceof NewsChannel ||
            channel instanceof ThreadChannel) &&
          channel.id === args[0].value
      ) as GuildTextChannel;

    const author: string = interaction.user.id;
    if (!newChannel || newChannel.id === interaction.channelId) {
      interaction
        .reply({
          content: 'Please specify a different channel',
          ephemeral: true,
        })
        .catch(console.error);
      return;
    }
    const embed: MessageEmbed = new MessageEmbed()
      .setTitle(
        `${this.channelName(
          interaction.channel!
        )} -> <:portal_blue:631237086988599317>`
      )
      .setDescription(
        `To ${this.channelName(newChannel)}\nRequested by <@${author}>`
      )
      .setTimestamp(new Date())
      .setColor(4176616);

    const oldMessage: void | Message | GuildCacheMessage<'raw'> =
      await interaction
        .reply({ embeds: [embed], fetchReply: true })
        .catch(console.error);
    if (!(oldMessage instanceof Message)) {
      console.error('oldMessage is not instanceof Message');
      return;
    }

    const message: void | Message = await newChannel
      .send({
        embeds: [
          new MessageEmbed()
            .setTitle(
              `<:portal_orange:631237087022022656> -> ${this.channelName(
                newChannel
              )}`
            )
            .setDescription(
              `[From ${this.channelName(oldMessage.channel)}](${
                oldMessage.url
              })\nRequested by <@${author}>`
            )
            .setTimestamp(new Date())
            .setColor(16285727),
        ],
      })
      .catch(console.error);
    if (!(message instanceof Message)) {
      console.error('message is not instanceof Message');
      return;
    }
    embed.setDescription(
      embed.description!.replace(/(To.*$)/m, `[$1](${message.url})`)
    );
    oldMessage.edit({ embeds: [embed] }).catch(console.error);
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
