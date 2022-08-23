import TwitchHelper, { Stream } from './TwitchHelper';
import CreateEmbed from './CreateEmbed';
import Settings from '../Settings';

/**
 * Handles the #live channel
 */
export default class LiveChannel {
  constructor() {
    new TwitchHelper(this.streamerFetch.bind(this)).update(
      (): string[] => Settings.settings.streamers
    );
  }

  /**
   * Creates a new embed for the #live channel whenever streamers are fetched
   * @param streams Currently live streams
   */
  private async streamerFetch(streams: Stream[]): Promise<void> {
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
