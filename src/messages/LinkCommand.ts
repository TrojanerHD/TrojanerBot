import Command from './Command';
import { TextChannel, Message, GuildChannel, MessageEmbed } from 'discord.js';

export default class LinkCommand extends Command {
  helpInfo: { name: string; value: string } = {
    name: '!link|!to <channel>',
    value:
      'Sends a message that the current conversation should be moved to the specified channel',
  };
  private _channel: TextChannel | undefined;
  private _newChannel: TextChannel | undefined;
  private _embed: MessageEmbed | undefined;
  private _oldMessage: Message | undefined;
  _author: string | undefined;

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
    this._newChannel =
      messageMentions.length !== 0 ? messageMentions[0] : channelNameMatch;
    if (
      this._newChannel.type !== 'text' ||
      this._newChannel.id === channel.id ||
      this._newChannel.parent?.name === 'Info' ||
      this._newChannel.name === 'smm2'
    ) {
      channel.send('Please specify a different channel!').catch(console.error);
      return;
    }
    this._author = message.author.id;
    this._channel = channel;
    this._embed = new MessageEmbed()
      .setTitle(`#${channel.name} -> <:portal_blue:631237086988599317>`)
      .setDescription(
        `To #${this._newChannel.name}\nRequested by <@${this._author}>`
      )
      .setTimestamp(new Date())
      .setColor(4176616);

    channel
      .send(this._embed)
      .then(this.sendMessageToNewChannel.bind(this))
      .catch(console.error);
  }

  sendMessageToNewChannel(message: Message) {
    this._oldMessage = message;
    this._newChannel!.send(
      new MessageEmbed()
        .setTitle(
          `<:portal_orange:631237087022022656> -> #${this._newChannel!.name}`
        )
        .setDescription(
          `[From #${this._channel!.name}](${message.url})\nRequested by <@${
            this._author
          }>`
        )
        .setTimestamp(new Date())
        .setColor(16285727)
    )
      .then(this.editOldMessage.bind(this))
      .catch(console.error);
  }

  editOldMessage(message: Message) {
    this._embed!.setDescription(
      this._embed!.description?.replace(/(To.*$)/m, `[$1](${message.url})`)
    );
    this._oldMessage!.edit(this._embed);
  }
}
