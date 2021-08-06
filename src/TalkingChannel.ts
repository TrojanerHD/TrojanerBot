import DiscordClient from './DiscordClient';
import {
  VoiceState,
  Guild,
  GuildChannel,
  CategoryChannel,
  VoiceChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

export default class TalkingChannel {
  /** Number of created channels */
  #talkingChannelCount: number = 0;
  /** The state after the voice state update */
  #newState?: VoiceState;
  /**
   * Creates talking channels that users can join onto. Always ensures that there is one free voice channel where someone can join
   */
  constructor() {
    DiscordClient._client.on(
      'voiceStateUpdate',
      this.onVoiceStateUpdate.bind(this)
    );
    for (const guild of DiscordClient._client.guilds.cache.toJSON())
      for (const channel of guild.channels.cache.toJSON())
        if (channel.name.startsWith('Talking '))
          channel.delete().catch(console.error);
  }

  /**
   * A handler that gets executed every time a voice state updates
   * @param oldState The state before the voice state update
   * @param newState The state after the voice state update
   */
  private onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
    this.#newState = newState;

    const channel: GuildChannel | null = oldState.channel;
    if (!channel || !channel.name.startsWith('Talking ')) {
      this.createChannelIfRequired();
      return;
    }

    if (channel.members.toJSON().length === 0) {
      channel.delete().then(() => {
        this.#talkingChannelCount--;
        this.renameNextChannels(channel);
      });
      return;
    }
    this.createChannelIfRequired();
  }

  /**
   * Renames all channels recursively after the current channel
   * @param channel Current channel
   */
  private renameNextChannels(channel: GuildChannel): void {
    const current: number = this.channelNameParser(channel)!;
    const guild: Guild = channel.guild;
    const nextChannel: GuildChannel | ThreadChannel | undefined =
      guild.channels.cache.find(
        (channel: GuildChannel | ThreadChannel): boolean =>
          channel.name === `Talking ${current + 1}`
      );
    if (
      channel.members.toJSON().length !== 0 ||
      !nextChannel ||
      nextChannel instanceof ThreadChannel
    ) {
      this.createChannelIfRequired();
      return;
    }
    nextChannel
      .setName(`Talking ${current}`)
      .then(() => this.renameNextChannels(nextChannel))
      .catch(console.error);
  }

  /**
   * Renames all channels recursively before the current channel
   * @param channel Current channel
   */
  private renamePreviousChannel(channel: GuildChannel): void {
    const current: number = this.channelNameParser(channel)!;
    if (current === 1) return;
    const guild: Guild = channel.guild;
    const previousChannel: GuildChannel | ThreadChannel | undefined =
      guild.channels.cache.find(
        (channel: GuildChannel | ThreadChannel): boolean =>
          channel.name === `Talking ${current - 1}`
      );
    if (previousChannel) return;
    channel
      .setName(`Talking ${current - 1}`)
      .then(() => this.renamePreviousChannel(channel));
  }

  /**
   * Gets a channel by its ID.
   * @param guild The guild where the channel should be
   * @param id The channel id to find
   * @throws Error when the channel does not exist
   * @returns The found channel
   */
  private getChannelById(guild: Guild, id: string): GuildChannel {
    const channel: GuildChannel | ThreadChannel | undefined =
      guild.channels.cache.find(
        (channel: GuildChannel | ThreadChannel): boolean => channel.id === id
      );
    if (!channel || channel instanceof ThreadChannel)
      throw new Error(
        `Channel with id ${id} does not exist in guild with id ${guild.id}`
      );
    return channel;
  }

  /**
   * Gets the number behind a talking channel
   * @param channel The talking channel
   * @returns The number of a talking channel if there is any
   */
  private channelNameParser(
    channel: GuildChannel | ThreadChannel
  ): number | undefined {
    if (!channel.name.startsWith('Talking')) return;
    if (channel.name === 'Talking') return 0;
    return +channel.name.split(' ')[1];
  }

  /**
   * Checks whether a new channel has to be created and creates it if so
   */
  private createChannelIfRequired(): void {
    if (!this.#newState!.channel) return;
    const guild: Guild = this.#newState!.guild;
    const channel: GuildChannel = this.getChannelById(
      guild,
      this.#newState!.channel.id
    );
    const channelNumber: number | undefined = this.channelNameParser(channel);
    if (
      channelNumber === undefined ||
      channelNumber !== this.#talkingChannelCount
    )
      return;
    guild.channels
      .create(`Talking ${++this.#talkingChannelCount}`, {
        parent: channel.parent!,
        type: 'GUILD_VOICE',
      })
      .then(this.channelCreated.bind(this))
      .catch(console.error);
  }

  /**
   * Callback for when a channel was created
   * @param channel The created channel
   */
  private channelCreated(
    channel: VoiceChannel | CategoryChannel | TextChannel
  ): void {
    if (
      (
        channel.guild.channels.cache.find(
          (channelToBeFound: GuildChannel | ThreadChannel): boolean =>
            `Talking ${this.channelNameParser(channelToBeFound)! - 1}` ===
              channel.name && channel instanceof GuildChannel
        ) as GuildChannel
      )?.members.toJSON().length === 0
    ) {
      channel.delete().catch(console.error);
      this.#talkingChannelCount--;
      return;
    }
    this.renamePreviousChannel(channel);
  }
}
