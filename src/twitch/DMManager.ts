import { User } from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Channel } from '../messages/StreamerCommand';
import Settings from '../Settings';
import TwitchHelper, { Stream } from './TwitchHelper';

interface UserFetchedContext {
  channel: Channel;
  streamers: Stream[];
  sendMessage: (user: User, stream: Stream) => void;
}

interface ChannelWithIndex {
  channel: Channel;
  index: number;
}

export default class DMManager {
  #twitchHelper: TwitchHelper = new TwitchHelper(
    this.streamerFetched.bind(this)
  );
  static validNameRegex: RegExp = /^[a-zA-Z0-9_\-]*$/;

  constructor() {
    this.#twitchHelper.update(
      Settings.getSettings()
        ['streamer-subscriptions'].map(
          (channel: Channel): string => channel.streamer
        )
        .filter(
          (streamer: string): boolean =>
            !!streamer.match(DMManager.validNameRegex)
        )
    );
  }

  private streamerFetched(streamers: Stream[]): void {
    this.#twitchHelper._streamerUpdate = Settings.getSettings()
      ['streamer-subscriptions'].map(
        (channel: Channel): string => channel.streamer
      )
      .filter(
        (streamer: string): boolean =>
          !!streamer.match(DMManager.validNameRegex)
      );
    const logins: string[] = streamers.map(
      (stream: Stream): string => stream.user_login
    );
    const dmPendingChannels: ChannelWithIndex[] = Settings.getSettings()
      ['streamer-subscriptions'].map(
        (channel: Channel, index: number): ChannelWithIndex => ({
          channel,
          index,
        })
      )
      .filter(
        ({ channel }: ChannelWithIndex): boolean =>
          logins.includes(channel.streamer) && !channel.sent
      );

    for (let i: number = 0; i < dmPendingChannels.length; ++i) {
      const channel = dmPendingChannels[i].channel;

      Settings.getSettings()['streamer-subscriptions'][
        dmPendingChannels[i].index
      ].sent = true;
      Settings.saveSettings();

      for (const subscriber of channel.subscribers)
        DiscordClient._client.users
          .fetch(subscriber)
          .then(
            this.userFetched.bind({
              channel: channel,
              streamers: streamers,
              sendMessage: this.sendMessage,
            })
          )
          .catch(console.error);
    }
    for (const channel of Settings.getSettings()[
      'streamer-subscriptions'
    ].filter(
      (channel: Channel): boolean =>
        !!channel.sent && !logins.includes(channel.streamer)
    )) {
      channel.sent = false;
    }
    Settings.saveSettings();
  }

  private userFetched(this: UserFetchedContext, user: User): void {
    const streamer: Stream | undefined = this.streamers.find(
      (stream: Stream): boolean => stream.user_login === this.channel.streamer
    );
    if (!streamer) return;
    this.channel.sent = true;
    if (!user.dmChannel)
      user
        .createDM()
        .then((): void => this.sendMessage(user, streamer))
        .catch(console.error);
    this.sendMessage(user, streamer);
  }

  private sendMessage(user: User, streamer: Stream): void {
    DiscordClient.send(user.dmChannel!, {
      content: `${streamer.user_name} is now live at https://twitch.tv/${streamer.user_name} streaming **${streamer.category}**`,
    });
  }
}
