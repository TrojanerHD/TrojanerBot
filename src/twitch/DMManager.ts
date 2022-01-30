import { User } from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Channel } from '../messages/StreamerCommand';
import Settings from '../Settings';
import TwitchHelper, { Stream } from './TwitchHelper';

interface UserFetchedContext {
  streamer?: Stream;
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
    this.#twitchHelper.update(() =>
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

      channel.sent = true;
      channel['started-at'] = 
        streamers.find(
          (login: Stream) => login.user_login === channel.streamer
        )!.started_at

      Settings.getSettings()['streamer-subscriptions'][
        dmPendingChannels[i].index
      ] = channel;
      Settings.saveSettings();

      for (const subscriber of channel.subscribers)
        DiscordClient._client.users
          .fetch(subscriber)
          .then(
            this.userFetched.bind({
              streamer: streamers.find(
                (stream: Stream): boolean =>
                  stream.user_login === channel.streamer
              ),
              sendMessage: this.sendMessage,
            })
          )
          .catch(console.error);
    }
    for (const channel of Settings.getSettings()[
      'streamer-subscriptions'
    ].filter(
      (channel: Channel): boolean =>
        !!channel.sent &&
        !logins.includes(channel.streamer) &&
        new Date().getTime() - new Date(channel['started-at']!).getTime() >= 5 * 60 * 1000 // Check to see whether five minutes have passed after stream start
    )) {
      channel.sent = false;
      delete channel['started-at'];
      Settings.saveSettings();
    }
  }

  private userFetched(this: UserFetchedContext, user: User): void {
    if (this.streamer === undefined) return;
    if (!user.dmChannel) {
      user
        .createDM()
        .then((): void => this.sendMessage(user, this.streamer!))
        .catch(console.error);
      return;
    }
    this.sendMessage(user, this.streamer);
  }

  private sendMessage(user: User, streamer: Stream): void {
    DiscordClient.send(user.dmChannel!, {
      content: `${streamer.user_name} is now live at https://twitch.tv/${streamer.user_name} streaming **${streamer.game_name}**`,
    });
  }
}
