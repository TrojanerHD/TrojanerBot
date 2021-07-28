import {
  Client,
  DMChannel,
  Intents,
  Message,
  MessageEmbed,
  NewsChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import MessageHandler from './messages/MessageHandler';
import LiveChannel from './twitch/LiveChannel';
import TalkingChannel from './TalkingChannel';
import RoleChannelManager from './roles/RoleChannelManager';
import Settings from './Settings';

export default class DiscordClient {
  static _client: Client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
  });

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

  private onReady(): void {
    new TalkingChannel();
    if (!DiscordClient._client.application?.owner)
      DiscordClient._client.application
        ?.fetch()
        .then(MessageHandler.addCommands)
        .catch(console.error);
    else MessageHandler.addCommands();
    if (Settings.getSettings().roles.length !== 0) new RoleChannelManager(); //TODO Warning system (see TODO in line 31)
  }

  /**
   * Starts doing stuff with Twitch for the #live channel
   */
  private startTwitch(): void {
    new LiveChannel();
  }

  static send(
    channel: TextChannel | DMChannel | NewsChannel | ThreadChannel | undefined,
    message: string | MessageEmbed,
    callback?: (message: Message) => void
  ): void {
    if (!channel) return;
    const msg: Promise<Message> =
      message instanceof MessageEmbed
        ? channel.send({ embeds: [message] })
        : channel.send(message);

    if (callback) msg.then(callback);
    msg.catch(console.error);
  }
}
