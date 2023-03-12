import TwitchHelper, { Stream } from './TwitchHelper';
import CreateEmbed from './CreateEmbed';
import GuildSettings from '../settings/GuildSettings';
import { Guild } from 'discord.js';

/**
 * Handles the #live channel
 */
export default class LiveChannel {
  #guild: Guild;

  constructor(guild: Guild) {
    this.#guild = guild;
    new TwitchHelper(this.streamerFetch.bind(this)).update(
      async (): Promise<string[]> =>
        (await GuildSettings.settings(guild.id)).streamers
    );
  }

  /**
   * Creates a new embed for the #live channel whenever streamers are fetched
   * @param streams Currently live streams
   */
  private async streamerFetch(streams: Stream[]): Promise<void> {
    const streamers: string[] = (await GuildSettings.settings(this.#guild.id)).streamers;
    streams.sort((a: Stream, b: Stream): number => {
      for (const streamer of streamers) {
        if (a.user_name === streamer) return -1;
        if (b.user_name === streamer) return 1;
      }
      return 0;
    });
    const createEmbed: CreateEmbed = new CreateEmbed(this.#guild);
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
