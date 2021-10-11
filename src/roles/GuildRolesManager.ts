import {
  Collection,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Snowflake,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { GuildTextChannel } from '../messages/Command';

export default class GuildRolesManager {
  #rolesChannel: GuildTextChannel;
  #newEmbed: MessageEmbed;

  constructor(rolesChannel: GuildTextChannel, newEmbed: MessageEmbed) {
    this.#newEmbed = newEmbed;
    this.#rolesChannel = rolesChannel;
    this.#rolesChannel.messages
      .fetch({ limit: 10 })
      .then(this.messagesFetched.bind(this))
      .catch(console.error);
  }

  private messagesFetched(messages: Collection<Snowflake, Message>): void {
    const rolesMessages: Message[] = messages.toJSON();
    const button: MessageActionRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('select')
        .setLabel('Select your roles')
        .setStyle('PRIMARY')
    );
    if (!rolesMessages[0]) {
      DiscordClient.send(this.#rolesChannel, {
        embeds: [this.#newEmbed!],
        components: [button],
      });
      return;
    }
    rolesMessages[0]
      .edit({ embeds: [this.#newEmbed!], components: [button] })
      .catch(console.error);
  }
}
