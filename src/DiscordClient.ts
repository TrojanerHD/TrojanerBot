import {
  Client,
  Collection,
  GuildChannel,
  ThreadChannel,
  ThreadMember,
  TextBasedChannel,
  GatewayIntentBits,
  BaseMessageOptions,
} from 'discord.js';
import MessageHandler from './messages/MessageHandler';
import ReactionHandler from './ReactionHandler';
import LiveChannel from './twitch/LiveChannel';
import TalkingChannel from './TalkingChannel';
import RoleChannelManager from './roles/RoleChannelManager';
import Settings from './Settings';
import DMManager from './twitch/DMManager';
import FeatureChecker from './FeatureChecker';
import { EmbedBuilder } from '@discordjs/builders';

/**
 * The discord client handler and initializer of the bot
 */
export default class DiscordClient {
  static _client: Client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  constructor() {
    new FeatureChecker();
    new MessageHandler();
    new ReactionHandler();
    DiscordClient._client.on('ready', this.onReady.bind(this));
    DiscordClient._client.on('threadCreate', this.onThreadCreate);
  }

  /**
   * Logs the discord client into the discord api and starts the handlers
   */
  login(): void {
    DiscordClient._client
      .login(process.env.DISCORD_TOKEN)
      .catch(console.error)
      .then((): void => {
        if (Settings.settings['twitch-id'] !== '' && process.env.TWITCH_TOKEN)
          this.startTwitch();
      });
  }

  /**
   * Fires when the Discord bot is ready
   */
  private async onReady(): Promise<void> {
    this.joinAllThreads();
    new TalkingChannel();
    if (!DiscordClient._client.application?.owner)
      await DiscordClient._client.application?.fetch().catch(console.error);
    MessageHandler.addCommands();
    if (Settings.settings.roles.length !== 0) new RoleChannelManager();
  }

  /**
   * Joins all threads to be available there
   */
  private joinAllThreads(): void {
    for (const guild of DiscordClient._client.guilds.cache.toJSON())
      for (const threadChannel of (
        guild.channels.cache.filter(
          (channel: GuildChannel | ThreadChannel): boolean =>
            channel instanceof ThreadChannel &&
            !channel.members.cache.some(
              (member: ThreadMember): boolean =>
                member.user!.id === DiscordClient._client.user!.id
            )
        ) as Collection<string, ThreadChannel>
      ).toJSON())
        threadChannel.join().catch(console.error);
  }

  /**
   * Starts doing stuff with Twitch for the #live channel and DM notification handling
   */
  private startTwitch(): void {
    new LiveChannel();
    new DMManager();
  }

  /**
   * Joins newly created threads to be available there
   * @param thread The thread to join
   */
  private onThreadCreate(thread: ThreadChannel): void {
    thread.join().catch(console.error);
  }

  /**
   * A wrapper for the most basic message sending
   * @param channel The channel to send the message in
   * @param message The message or embed to send
   */
  public static send(
    channel: TextBasedChannel | undefined,
    message: EmbedBuilder | BaseMessageOptions
  ): void {
    if (!channel) return;
    let send: BaseMessageOptions = {};
    if (message instanceof EmbedBuilder) send.embeds = [message];
    else send = message;

    channel.send(send).catch(console.error);
  }
}
