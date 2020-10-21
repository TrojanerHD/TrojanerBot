import { Message } from 'discord.js';

export default class MessageDeletion {
  private _message: Message;

  constructor(message: Message) {
    this._message = message;
  }

  async commandNotExistsCallback(message: Message) {
    const userMessage: Message = this._message;
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
}
