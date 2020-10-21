import { Client } from 'discord.js';
import MessageHandler from './messages/MessageHandler';
import LiveChannel from './twitch/LiveChannel';
import TalkingChannel from './TalkingChannel';

export class DiscordClient {
  static _client: Client = new Client();

  /**
   * The discord client handler and initializer of the bot
   */
  constructor() {
    new MessageHandler();
  }

  /**
   * Logs the discord client into the discord api and starts the handlers
   */
  login(): void {
    DiscordClient._client
      .login(process.env.DISCORD_TOKEN)
      .catch(console.error)
      .then(() => {
        this.startTwitch();
        new TalkingChannel();
      });
  }

  /**
   * Starts doing stuff with Twitch for the #live channel
   */
  private startTwitch(): void {
    new LiveChannel();
  }
}
