import { Message } from 'discord.js';
import Settings from '../Settings';

export default class MessageDeletion {
  #message: Message;

  constructor(message: Message) {
    this.#message = message;
  }

  private async commandNotExistsCallback(message: Message): Promise<void> {
    const userMessage: Message = this.#message;
    await new Promise((resolve) => setTimeout(resolve, 5000));
    if (
      userMessage &&
      !userMessage.deleted &&
      userMessage.mentions.members?.array().length === 0 &&
      userMessage.mentions.roles.array().length === 0
    )
      userMessage.delete().catch(console.error);
    else return;
    if (!message.deleted) message.delete().catch(console.error);
  }

  checkDeletion(message: Message): void {
    if (Settings.getSettings()['delete-messages-on-error'])
      this.commandNotExistsCallback(message);
  }
}
