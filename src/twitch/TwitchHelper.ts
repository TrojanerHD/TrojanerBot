import Settings from '../Settings';
import { requestWrapper as request } from '../common';

export interface Category {
  name: string;
  id: string;
}

export interface Stream {
  game_name: string;
  user_name: string;
  user_login: string;
  title: string;
  viewer_count: number;
  started_at: string;
}

export interface StreamData {
  data: Stream[];
}

/**
 * A wrapper for Twitch API calls with update cycle
 */
export default class TwitchHelper {
  /** The access token for the Twitch API */
  #accessToken?: string;
  #streamerUpdate: () => string[] = () => [];
  #streamerUpdateSplit: string[][] = [];
  #callback: (streams: Stream[]) => Promise<void>;

  constructor(callback: (streams: Stream[]) => Promise<void>) {
    this.#callback = callback;
  }

  /**
   * Creates a url for the Twitch API to fetch
   * @param streamers All streamers to fetch
   * @returns The formatted url
   */
  static generateUrl(streamers: string[]): string {
    return streamers
      .map((streamer: string): string => `user_login=${streamer.toLowerCase()}`)
      .join('&');
  }
  /**
   * Fetches the current state of streams
   * @param streamerUpdate Function to execute to obtain the streamers to fetch
   */
  async update(streamerUpdate?: () => string[]): Promise<void> {
    if (streamerUpdate !== undefined) this.#streamerUpdate = streamerUpdate;
    const streamers: string[] = this.#streamerUpdate();
    if (streamers.length === 0) {
      this.timeout();
      return;
    }
    this.#streamerUpdateSplit = [];
    for (let i: number = 0; i < streamers.length; i += 100)
      this.#streamerUpdateSplit.push(streamers.slice(i, i + 100));
    if (!this.#accessToken)
      await this.accessTokenRequest().catch(console.error);
    this.channelRequest();
  }

  /**
   * Creates a request for fetching updates from streamers from Twitch
   */
  private async channelRequest(): Promise<void> {
    const streams: Stream[] = [];
    for (const streamers of this.#streamerUpdateSplit) {
      let req: string | void = undefined;
      while (req === undefined)
        req = await request(
          {
            host: 'api.twitch.tv',
            path: `/helix/streams?${TwitchHelper.generateUrl(streamers)}`,
            headers: {
              'Client-ID': Settings.settings['twitch-id'],
              Authorization: `Bearer ${this.#accessToken}`,
            },
          },
          TwitchHelper.generateUrl(streamers)
        ).catch(console.error);

      const stream: StreamData = JSON.parse(req);
      streams.push.apply(streams, stream.data);
    }

    streams.sort((a: Stream, b: Stream): number => {
      for (const streamer of Settings.settings.streamers) {
        if (a.user_name === streamer) return -1;
        if (b.user_name === streamer) return 1;
      }
      return 0;
    });

    this.#callback(streams)
      .then(this.timeout.bind(this))
      .catch((reason: any): void => {
        console.error(reason);
        this.timeout();
      });
  }

  /**
   * Sets the timeout for the update function
   */
  private timeout(): void {
    setTimeout(this.update.bind(this), 10000);
  }

  /**
   * Creates a request to get an access token and stores it
   */
  private async accessTokenRequest(): Promise<void> {
    const params = new URLSearchParams();
    params.append('client_id', Settings.settings['twitch-id']);
    params.append('client_secret', process.env.TWITCH_TOKEN!);
    params.append('grant_type', 'client_credentials');
    let req: string | void = undefined;
    while (req === undefined)
      req = await request(
        {
          host: 'id.twitch.tv',
          path: `/oauth2/token`,
          method: 'POST',
        },
        params.toString()
      ).catch(console.error);

    this.#accessToken = JSON.parse(req).access_token;
  }
}
