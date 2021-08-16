import { DMChannel, User } from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Channel } from '../messages/StreamerCommand';
import Settings from '../Settings';
import TwitchHelper, { Stream } from './TwitchHelper';

export default class DMManager {
  _channel: Channel = { streamer: '', subscribers: [], sent: false };
  _streamers: Stream[] = [];
  _user?: User;
  _streamer?: Stream;

  constructor() {
    new TwitchHelper(this.streamerFetched.bind(this)).update((): string[] =>
      Settings.getSettings()['streamer-subscriptions'].map(
        (channel: Channel): string => channel.streamer
      )
    );
  }

  private streamerFetched(streamers: Stream[]): void {
    const logins: string[] = streamers.map(
      (stream: Stream): string => stream.user_login
    );
    for (const channel of Settings.getSettings()[
      'streamer-subscriptions'
    ].filter((channel: Channel): boolean => logins.includes(channel.streamer))){
      for (const subscriber of channel.subscribers)
        DiscordClient._client.users
          .fetch(subscriber)
          .then(
            this.usersFetched.bind({
              _channel: channel,
              _streamers: streamers,
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

  private usersFetched(user: User): void {
    const streamer: Stream | undefined = this._streamers.find(
      (stream: Stream): boolean => stream.user_login === this._channel.streamer
    );
    if (!streamer || !!this._channel.sent) return;
    this._channel.sent = true;
		Settings.getSettings()['streamer-subscriptions'].find((channel: Channel) => channel.streamer === this._channel.streamer)!.sent = true;
		Settings.saveSettings();
    if (!user.dmChannel)
      user
        .createDM()
        .then(this.sendMessage.bind({ _user: user, _streamer: streamer }))
        .catch(console.error);
    this.sendMessage(user, streamer);
  }

  private sendMessage(user?: User | DMChannel, streamer?: Stream): void {
    if (!user || user instanceof DMChannel) user = this._user;
    if (!streamer) streamer = this._streamer;
    user!.dmChannel
      ?.send(
        `${streamer!.user_name} is now live at https://twitch.tv/${
          streamer!.user_name
        } playing **${streamer!.category}**`
      )
      .catch(console.error);
  }
}
