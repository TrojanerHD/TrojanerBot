import {
  Client,
  Collection,
  GuildChannel,
  Intents,
  MessageEmbed,
  ThreadChannel,
  ThreadMember,
  MessageOptions,
  TextBasedChannel,
  Guild,
} from 'discord.js';
import MessageHandler from './messages/MessageHandler';
import ReactionHandler from './ReactionHandler';
import LiveChannel from './twitch/LiveChannel';
import TalkingChannel from './TalkingChannel';
import RoleChannelManager from './roles/RoleChannelManager';
import Settings from './Settings';
import DMManager from './twitch/DMManager';
import FeatureChecker from './FeatureChecker';
import GuildSettings from './settings/GuildSettings';

/**
 * The discord client handler and initializer of the bot
 */
export default class DiscordClient {
  public static _client: Client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
  });

  public static _safeGuilds: Guild[] = [];

  constructor() {
    DiscordClient._client.on('ready', this.onReady.bind(this));
    DiscordClient._client.on('threadCreate', this.onThreadCreate);
    DiscordClient._client.on('guildCreate', this.onGuildJoin.bind(this));
  }

  /**
   * Logs the discord client into the discord api and starts the handlers
   */
  login(): void {
    DiscordClient._client.login(process.env.DISCORD_TOKEN).catch(console.error);
  }

  /**
   * Fires when the Discord bot is ready
   */
  private async onReady(): Promise<void> {
    await new FeatureChecker().check();
    new MessageHandler();
    new ReactionHandler();
    if (this.twitchEnabled()) this.startTwitch();
    this.joinAllThreads();
    new TalkingChannel();
    if (!DiscordClient._client.application?.owner)
      await DiscordClient._client.application?.fetch().catch(console.error);
    MessageHandler.addCommands();
    for (const guild of DiscordClient._safeGuilds) {
      const mgr: RoleChannelManager = new RoleChannelManager(guild);
      if ((await GuildSettings.settings(guild.id)).roles.length !== 0)
        mgr.run();
    }
  }

  /**
   * Sets the bot up to be ready for a guild
   * @param guild The guild the bot joined
   */
  private async onGuildJoin(guild: Guild): Promise<void> {
    new FeatureChecker().checkGuild(guild);
    if (this.twitchEnabled()) new LiveChannel(guild);
    const mgr: RoleChannelManager = new RoleChannelManager(guild);
    if ((await GuildSettings.settings(guild.id)).roles.length !== 0) mgr.run()
  }

  /**
   * Checks if the bot has been set up correctly to use Twitch
   * @returns Whether Twitch is ready to be used
   */
  private twitchEnabled(): boolean {
    return Settings.settings['twitch-id'] !== '' && !!process.env.TWITCH_TOKEN;
  }

  /**
   * Joins all threads to be available there
   */
  private joinAllThreads(): void {
    for (const guild of DiscordClient._safeGuilds)
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
    for (const guild of DiscordClient._safeGuilds) new LiveChannel(guild);
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
    message: MessageEmbed | MessageOptions
  ): void {
    if (!channel) return;
    let send: MessageOptions = {};
    if (message instanceof MessageEmbed) send.embeds = [message];
    else send = message;

    channel.send(send).catch(console.error);
  }
}
