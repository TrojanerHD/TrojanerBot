import fetch, { Response } from 'node-fetch';
import Settings from '../Settings';

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

export default class TwitchHelper {
  /** The access token for the Twitch api */
  #accessToken?: string;
  #streamerUpdate: () => string[] = () => [];
  #streamerUpdateSplit: string[][] = [];
  #callback: (streams: Stream[]) => void;

  constructor(callback: (streams: Stream[]) => void) {
    this.#callback = callback;
  }

  /**
   * Creates a url for the Twitch API to fetch
   * @param streamers All streamers to fetch
   * @returns The formatted url
   */
  static generateUrl(streamers: string[]): string {
    return `https://api.twitch.tv/helix/streams?${streamers
      .map((streamer: string): string => `user_login=${streamer.toLowerCase()}`)
      .join('&')}`;
  }
  /**
   * Fetches the current state of streams
   * @param streamerUpdate Function to execute to obtain the streamers to fetch
   */
  update(streamerUpdate?: () => string[]): void {
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
      this.accessTokenRequest(this.channelRequest.bind(this));
    else this.channelRequest();
  }

  /**
   * Creates a request for fetching updates from streamers from Twitch
   */
  private async channelRequest(): Promise<void> {
    const streams: Stream[] = [];
    for (const streamers of this.#streamerUpdateSplit)
      try {
        const res: Response = await fetch(TwitchHelper.generateUrl(streamers), {
          headers: {
            'Client-ID': Settings.getSettings()['twitch-id'],
            Authorization: `Bearer ${this.#accessToken}`,
          },
        });

        const stream: StreamData = await res.json();
        if (!stream) {
          console.error(
            'Error in TwitchHelper.ts on line 78:\nstream is undefined'
          );
          this.timeout();
          return;
        }
        if ('error' in streams) {
          console.error(
            `Error in TwitchHelper.ts on line 85:\n${JSON.stringify(
              streams,
              null,
              2
            )}`
          );
          this.timeout();
          return;
        }
        streams.push.apply(streams, stream.data);
      } catch (e: any) {
        console.error(e);
      }

    streams.sort((a: Stream, b: Stream): number => {
      for (const streamer of Settings.getSettings().streamers) {
        if (a.user_name === streamer) return -1;
        if (b.user_name === streamer) return 1;
      }
      return 0;
    });

    this.#callback(streams);
    this.timeout();
  }

  /**
   * Sets the timeout for the update function
   */
  private timeout(): void {
    setTimeout(this.update.bind(this), 10000);
  }

  /**
   * Creates a request to get an access token and calls a function afterward
   * @param callback The function to call after the access token was obtained
   */
  private accessTokenRequest(callback: () => void): void {
    fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${
        Settings.getSettings()['twitch-id']
      }&client_secret=${
        process.env.TWITCH_TOKEN
      }&grant_type=client_credentials`,
      { method: 'POST' }
    )
      .then((res: Response) => res.json())
      .catch(console.error)
      .then((data: any) => {
        this.#accessToken = data.access_token;
        callback();
      });
  }
}
