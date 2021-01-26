import { Client } from 'discord.js';
import MessageHandler from './messages/MessageHandler';
import LiveChannel from './twitch/LiveChannel';
import TalkingChannel from './TalkingChannel';
import RoleChannelManager from './roles/RoleChannelManager';
import Settings from './Settings';

export class DiscordClient {
  static _client: Client = new Client();

  /**
   * The discord client handler and initializer of the bot
   */
  constructor() {
    new MessageHandler();
    DiscordClient._client.on('ready', this.onReady);
  }

  /**
   * Logs the discord client into the discord api and starts the handlers
   */
  login(): void {
    DiscordClient._client
      .login(process.env.DISCORD_TOKEN)
      .catch(console.error)
      .then(() => {
        if (Settings.getSettings()['twitch-id'] !== '') this.startTwitch();
        else
          console.log(
            'Twitch module not loaded. Add a twitch id to the settings.json'
          ); //TODO: Rewrite message and create a warning system that reports what features are enabled/disabled
      });
  }

  onReady(): void {
    new TalkingChannel();
    if (Settings.getSettings().roles.length !== 0) new RoleChannelManager(); //TODO Warning system (see TODO in line 31)
  }

  /**
   * Starts doing stuff with Twitch for the #live channel
   */
  private startTwitch(): void {
    new LiveChannel();
  }
}
