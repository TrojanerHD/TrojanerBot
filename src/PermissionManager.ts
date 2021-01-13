import { Role, TextChannel, Message, MessageEmbed } from 'discord.js';
import MessageDeletion from './messages/MessageDeletion';

export default class PermissionManager {
  static hasPermission(
    roles: Role[] | undefined,
    channel: TextChannel,
    message: Message
  ): boolean {
    const permission: boolean = roles ? !!roles.find(
      (role: Role) => role.name === 'Moderator' || role.name === 'Owner'
    ) : false;
    if (!permission) {
      const messageDeletion: MessageDeletion = new MessageDeletion(message);
      const errorMessage: MessageEmbed = new MessageEmbed()
        .setTitle('Error')
        .setTimestamp(new Date())
        .setDescription(
          `You do not have the permission to perform this command\n[Message](${message.url})`
        )
        .addField('Message Content', message.content, false)
        .setFooter(message.author.tag)
        .setColor(16711680);

      channel
        .send(errorMessage)
        .then(messageDeletion.commandNotExistsCallback.bind(messageDeletion))
        .catch(console.error);
    }
    return permission;
  }
}
