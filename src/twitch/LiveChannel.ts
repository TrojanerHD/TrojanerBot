import TwitchHelper, { Stream } from './TwitchHelper';
import CreateEmbed from './CreateEmbed';
import Settings from '../Settings';
import GuildSettings from '../settings/GuildSettings';

/**
 * Handles the #live channel
 */
export default class LiveChannel {
  #guildId: string;

  constructor(guildId: string) {
    this.#guildId = guildId;
    new TwitchHelper(this.streamerFetch.bind(this)).update(
      async (): Promise<string[]> =>
        (await GuildSettings.settings(guildId)).streamers
    );
  }

  /**
   * Creates a new embed for the #live channel whenever streamers are fetched
   * @param streams Currently live streams
   */
  private async streamerFetch(streams: Stream[]): Promise<void> {
    const streamers = (await GuildSettings.settings(this.#guildId)).streamers;
    streams.sort((a: Stream, b: Stream): number => {
      for (const streamer of streamers) {
        if (a.user_name === streamer) return -1;
        if (b.user_name === streamer) return 1;
      }
      return 0;
    });
    const createEmbed: CreateEmbed = new CreateEmbed();
    for (const stream of streams.slice(0, 5))
      createEmbed.addField({
        category: stream.game_name,
        name: stream.user_name,
        title: stream.title,
        viewer_count: stream.viewer_count,
      });
    await createEmbed.sendEmbed();
  }
}
