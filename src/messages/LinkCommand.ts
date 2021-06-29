import Command from './Command';
import { TextChannel, Message, GuildChannel, MessageEmbed, Channel } from 'discord.js';
import { DiscordClient } from '../DiscordClient';

export default class LinkCommand extends Command {
  helpInfo: { name: string; value: string } = {
    name: 'link|to <channel>',
    value:
      'Sends a message that the current conversation should be moved to the specified channel',
  };
  #channel?: TextChannel;
  #newChannel?: TextChannel;
  #embed?: MessageEmbed;
  #oldMessage?: Message;
  #author?: string;

  handleCommand(args: string[], channel: TextChannel, message: Message): void {
    const channelNameMatch: TextChannel | undefined = <TextChannel>(
      message.guild?.channels.cache.find(
        (channel: GuildChannel) =>
          channel.type === 'text' && channel.name === args[0]
      )
    );
    const messageMentions: TextChannel[] = message.mentions.channels.array().filter((value: Channel) => value instanceof TextChannel) as TextChannel[];
    if (
      args.length < 1 ||
      (messageMentions.length === 0 && !channelNameMatch)
    ) {
      DiscordClient.send(
        channel,
        'Please specify a channel! Syntax: `!<link|to> #<Discord Channel>`'
      );
      return;
    }
    this.#newChannel =
      messageMentions.length !== 0 ? messageMentions[0] : channelNameMatch;
    if (
      this.#newChannel.type !== 'text' ||
      this.#newChannel.id === channel.id
    ) {
      DiscordClient.send(channel, 'Please specify a different channel!');
      return;
    }
    this.#author = message.author.id;
    this.#channel = channel;
    this.#embed = new MessageEmbed()
      .setTitle(`#${channel.name} -> <:portal_blue:631237086988599317>`)
      .setDescription(
        `To #${this.#newChannel.name}\nRequested by <@${this.#author}>`
      )
      .setTimestamp(new Date())
      .setColor(4176616);

    DiscordClient.send(
      channel,
      this.#embed,
      this.sendMessageToNewChannel.bind(this)
    );
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
