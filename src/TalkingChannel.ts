import { DiscordClient } from './DiscordClient';
import {
  VoiceState,
  Guild,
  GuildChannel,
  CategoryChannel,
  Channel,
  VoiceChannel,
  TextChannel,
} from 'discord.js';

export default class TalkingChannel {
  /** Number of created channels */
  private _talkingChannelCount: number = 0;
  /** The state after the voice state update */
  private _newState: VoiceState | undefined;
  /**
   * Creates talking channels that users can join onto. Always ensures that there is one free voice channel where someone can join
   */
  constructor() {
    DiscordClient._client.on(
      'voiceStateUpdate',
      this.onVoiceStateUpdate.bind(this)
    );
    for (const guild of DiscordClient._client.guilds.cache.array())
      for (const channel of guild.channels.cache.array())
        if (channel.name.startsWith('Talking ')) channel.delete();
  }

  /**
   * A handler that gets executed every time a voice state updates
   * @param oldState The state before the voice state update
   * @param newState The state after the voice state update
   */
  private onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
    this._newState = newState;

    const channel: GuildChannel | null = oldState.channel;
    if (!channel || !channel.name.startsWith('Talking ')) {
      this.createChannelIfRequired();
      return;
    }

    if (channel.members.array().length === 0) {
      channel.delete().then(() => {
        this._talkingChannelCount--;
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
    const nextChannel: GuildChannel | undefined = guild.channels.cache.find(
      (channel: GuildChannel) => channel.name === `Talking ${current + 1}`
    );
    if (channel.members.array().length !== 0 || !nextChannel) {
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
    const previousChannel: GuildChannel | undefined = guild.channels.cache.find(
      (channel: GuildChannel) => channel.name === `Talking ${current - 1}`
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
    const channel: GuildChannel | undefined = guild.channels.cache.find(
      (channel: GuildChannel) => channel.id === id
    );
    if (!channel)
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
  private channelNameParser(channel: GuildChannel): number | undefined {
    if (!channel.name.startsWith('Talking')) return;
    if (channel.name === 'Talking') return 0;
    return +channel.name.split(' ')[1];
  }

  /**
   * Checks whether a new channel has to be created and creates it if so
   */
  private createChannelIfRequired(): void {
    if (!this._newState!.channel) return;
    const guild: Guild = this._newState!.guild;
    const channel: GuildChannel = this.getChannelById(
      guild,
      this._newState!.channel.id
    );
    const channelNumber: number | undefined = this.channelNameParser(channel);
    if (
      channelNumber === undefined ||
      channelNumber !== this._talkingChannelCount
    )
      return;
    guild.channels
      .create(`Talking ${++this._talkingChannelCount}`, {
        parent: <Channel>channel.parent,
        type: 'voice',
      })
      .then(this.channelCreated.bind(this));
  }

  /**
   * Callback for when a channel was created
   * @param channel The created channel
   */
  private channelCreated(
    channel: VoiceChannel | CategoryChannel | TextChannel
  ): void {
    if (
      channel.guild.channels.cache
        .find(
          (channelToBeFound: GuildChannel) =>
            `Talking ${this.channelNameParser(channelToBeFound)! - 1}` ===
            channel.name
        )
        ?.members.array().length === 0
    ) {
      channel.delete();
      this._talkingChannelCount--;
      return;
    }
    this.renamePreviousChannel(channel);
  }
}
