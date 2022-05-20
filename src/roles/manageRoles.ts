import {
  Collection,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { GuildTextChannel } from '../messages/Command';

export default async function manageRoles(
  rolesChannel: GuildTextChannel,
  newEmbed: MessageEmbed
): Promise<void> {
  const messages: void | Collection<string, Message> =
    await rolesChannel.messages.fetch({ limit: 10 }).catch(console.error);
  if (!messages) return;
  const rolesMessage: Message | undefined = messages
    .toJSON()
    .find(
      (message: Message): boolean =>
        message.author.id === DiscordClient._client.user!.id
    );
  const button: MessageActionRow = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('select')
      .setLabel('Select your roles')
      .setStyle('PRIMARY')
  );
  if (rolesMessage === undefined) {
    DiscordClient.send(rolesChannel, {
      embeds: [newEmbed],
      components: [button],
    });
    return;
  }
  rolesMessage
    .edit({ embeds: [newEmbed], components: [button] })
    .catch(console.error);
}
