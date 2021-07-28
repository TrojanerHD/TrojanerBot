import Command from './Command';
import { TextChannel, Message, GuildChannel, MessageEmbed } from 'discord.js';

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
    const messageMentions: TextChannel[] = message.mentions.channels.array();
    if (
      args.length < 1 ||
      (messageMentions.length === 0 && !channelNameMatch)
    ) {
      channel
        .send(
          'Please specify a channel! Syntax: `!<link|to> #<Discord Channel>`'
        )
        .catch(console.error);
      return;
    }
    this.#newChannel =
      messageMentions.length !== 0 ? messageMentions[0] : channelNameMatch;
    if (
      this.#newChannel.type !== 'text' ||
      this.#newChannel.id === channel.id ||
      this.#newChannel.parent?.name === 'Info' ||
      this.#newChannel.name === 'smm2'
    ) {
      channel.send('Please specify a different channel!').catch(console.error);
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

    channel
      .send(this.#embed)
      .then(this.sendMessageToNewChannel.bind(this))
      .catch(console.error);
  }

  private sendMessageToNewChannel(message: Message) {
    this.#oldMessage = message;
    this.#newChannel!.send(
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
        .setColor(16285727)
    )
      .then(this.editOldMessage.bind(this))
      .catch(console.error);
  }

  editOldMessage(message: Message) {
    this.#embed!.setDescription(
      this.#embed!.description?.replace(/(To.*$)/m, `[$1](${message.url})`)
    );
    this.#oldMessage!.edit(this.#embed!);
  }
}
