import { Role, TextChannel, Message, MessageEmbed } from 'discord.js';
import MessageDeletion from './messages/MessageDeletion';
import Settings from './Settings';

export default class PermissionManager {
  static hasPermission(
    channel: TextChannel,
    message: Message,
    roles?: Role[]
  ): boolean {
    const permission: boolean = roles
      ? !!roles.find((role: Role) =>
          Settings.getSettings()['permission-roles'].includes(role.name)
        )
      : false;
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
        .then(messageDeletion.checkDeletion.bind(messageDeletion))
        .catch(console.error);
    }
    return permission;
  }
}
