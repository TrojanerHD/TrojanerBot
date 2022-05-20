import TwitchHelper, { Stream } from './TwitchHelper';
import CreateEmbed from './CreateEmbed';
import Settings from '../Settings';

export default class LiveChannel {
  /**
   * Handles the #live channel
   */
  constructor() {
    new TwitchHelper(this.streamerFetch.bind(this)).update(
      (): string[] => Settings.getSettings().streamers
    );
  }

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
