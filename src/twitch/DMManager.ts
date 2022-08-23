import {
  DMChannel,
  Message,
  MessageEditOptions,
  MessageOptions,
  User,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Channel } from '../messages/StreamerCommand';
import Settings from '../Settings';
import TwitchHelper, { Stream } from './TwitchHelper';
import Common from '../common';

interface StreamerMessage {
  message: Message;
  streamer: string;
  game: string;
}

/**
 * Handles DMs for Twitch notifications
 */
export default class DMManager {
  #twitchHelper: TwitchHelper = new TwitchHelper(
    this.streamerFetched.bind(this)
  );
  /**
   * Actively updated stream messages for category changes
   */
  static #messages: StreamerMessage[] = [];

  /**
   * Regex for valid twitch username
   */
  static validNameRegex: RegExp = /^[a-zA-Z0-9_\-]+$/;

  constructor() {
    this.#twitchHelper.update((): string[] =>
      Settings.settings['streamer-subscriptions']
        .map((channel: Channel): string => channel.streamer)
        .filter(
          (streamer: string): boolean =>
            !!streamer.match(DMManager.validNameRegex)
        )
    );
  }

  /**
   * Callback function for when streamers that are currently live were fetched
   * @param streamers The fetched streamers
   */
  private async streamerFetched(streamers: Stream[]): Promise<void> {
    const logins: string[] = streamers.map(
      (stream: Stream): string => stream.user_login
    );
    // Filter for channels that are currently live and a message has not yet been sent
    const dmPendingChannels: [number, Channel][] = [
      ...Settings.settings['streamer-subscriptions'].entries(),
    ].filter(
      ({ 1: channel }: [number, Channel]): boolean =>
        logins.includes(channel.streamer) && !channel.sent
    );

    for (const channelWithIndex of dmPendingChannels) {
      const channel: Channel = channelWithIndex[1];

      channel.sent = true;
      channel['started-at'] = streamers.find(
        (login: Stream) => login.user_login === channel.streamer
      )!.started_at;

      Settings.settings['streamer-subscriptions'][channelWithIndex[0]] =
        channel;
      Settings.saveSettings();

      // Send notification to each subscriber
      for (const subscriber of channel.subscribers) {
        const user: void | User = await DiscordClient._client.users
          .fetch(subscriber)
          .catch(console.error);
        if (!user) continue;
        const streamer: Stream | undefined = streamers.find(
          (stream: Stream): boolean => stream.user_login === channel.streamer
        );
        if (streamer === undefined) continue;
        let dmChannel: DMChannel | null = user.dmChannel;
        if (dmChannel === null) {
          const tempDmChannel: DMChannel | void = await user
            .createDM()
            .catch(console.error);
          if (!tempDmChannel) continue;
          dmChannel = tempDmChannel;
        }
        await dmChannel
          .send(DMManager.generateMessage(streamer))
          .catch(console.error);
      }
    }
    // Reset every streamer that is not live anymore and a message has been sent for
    for (const channel of Settings.settings['streamer-subscriptions'].filter(
      (channel: Channel): boolean =>
        !!channel.sent &&
        !logins.includes(channel.streamer) &&
        Date.now() - new Date(channel['started-at']!).getTime() >= 5 * 60 * 1000 // Check to see whether five minutes have passed after stream start
    )) {
      channel.sent = false;
      delete channel['started-at'];
      Settings.saveSettings();
      // Exclude streamer live message from actively maintained messages
      if (
        DMManager.#messages.some(
          (value: StreamerMessage): boolean =>
            value.streamer === channel.streamer
        )
      )
        DMManager.#messages = DMManager.#messages.filter(
          (value: StreamerMessage): boolean =>
            value.streamer !== channel.streamer
        );
    }
    // Update category for each streamer
    for (const streamer of streamers) {
      const messageStream: StreamerMessage | undefined =
        DMManager.#messages.find(
          (value: StreamerMessage): boolean =>
            value.streamer === streamer.user_login &&
            value.game !== streamer.game_name
        );
      if (!messageStream) continue;
      messageStream.game = streamer.game_name;
      await messageStream.message
        .edit(DMManager.generateMessage(streamer))
        .catch(console.error);
    }
    return Promise.resolve();
  }

  /**
   * Generates a message to send into the DM channel
   * @param streamer The streamer to generate the message for
   * @returns The proper message options
   */
  private static generateMessage(
    streamer: Stream
  ): MessageOptions & MessageEditOptions {
    return {
      content: `${Common.sanitize(
        streamer.user_name
      )} is now live at https://twitch.tv/${
        streamer.user_name
      } streaming **${Common.sanitize(streamer.game_name)}**`,
    };
  }
}
