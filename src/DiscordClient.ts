import {
  Client,
  Collection,
  GuildChannel,
  Intents,
  Message,
  MessageEmbed,
  TextBasedChannels,
  ThreadChannel,
  ThreadMember,
  MessageOptions,
} from 'discord.js';
import MessageHandler from './messages/MessageHandler';
import ReactionHandler from './ReactionHandler';
import LiveChannel from './twitch/LiveChannel';
import TalkingChannel from './TalkingChannel';
import RoleChannelManager from './roles/RoleChannelManager';
import Settings from './Settings';
import DMManager from './twitch/DMManager';
import FeatureChecker from './FeatureChecker';

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
        if (
          Settings.getSettings()['twitch-id'] !== '' &&
          process.env.TWITCH_TOKEN
        )
          this.startTwitch();
      });
  }

  private onReady(): void {
    this.joinAllThreads();
    new TalkingChannel();
    if (!DiscordClient._client.application?.owner)
      DiscordClient._client.application
        ?.fetch()
        .then(MessageHandler.addCommands)
        .catch(console.error);
    else MessageHandler.addCommands();
    if (Settings.getSettings().roles.length !== 0) new RoleChannelManager();
  }

  private joinAllThreads(): void {
    for (const guild of DiscordClient._client.guilds.cache.toJSON())
      for (const threadChannel of (
        guild.channels.cache.filter(
          (channel: GuildChannel | ThreadChannel) =>
            channel instanceof ThreadChannel &&
            !channel.members.cache.find(
              (member: ThreadMember) =>
                member.user!.id === DiscordClient._client.user!.id
            )
        ) as Collection<string, ThreadChannel>
      ).toJSON())
        threadChannel.join().catch(console.error);
  }

  /**
   * Starts doing stuff with Twitch for the #live channel
   */
  private startTwitch(): void {
    new LiveChannel();
    new DMManager();
  }

  private onThreadCreate(thread: ThreadChannel): void {
    thread.join().catch(console.error);
  }

  static send(
    channel: TextBasedChannels | undefined,
    message: MessageEmbed | MessageOptions,
    callback?: (message: Message) => void
  ): void {
    if (!channel) return;
    let send: MessageOptions = {};
    if (message instanceof MessageEmbed) send.embeds = [message];
    else send = message;
    const msg: Promise<Message> = channel.send(send);

    if (callback) msg.then(callback);
    msg.catch(console.error);
  }
}
