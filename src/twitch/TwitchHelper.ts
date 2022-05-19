import Settings from '../Settings';
import { request } from 'https';
import { IncomingMessage } from 'http';

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
    for (const streamers of this.#streamerUpdateSplit) {
      const stream: StreamData = await this.requestWrapper(streamers);
      streams.push.apply(streams, stream.data);
    }

    streams.sort((a: Stream, b: Stream): number => {
      for (const streamer of Settings.getSettings().streamers) {
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

  private async requestWrapper(streamers: string[]): Promise<StreamData> {
    return new Promise(
      (
        resolve: (data: StreamData) => void,
        reject: (e: Error) => void
      ): void => {
        request(
          {
            host: 'api.twitch.tv',
            path: `/helix/streams?${TwitchHelper.generateUrl(streamers)}`,
            headers: {
              'Client-ID': Settings.getSettings()['twitch-id'],
              Authorization: `Bearer ${this.#accessToken}`,
            },
          },
          (res: IncomingMessage): void => {
            let data: string = '';
            res.on('error', reject);
            res.on('data', (chunk: Buffer): string => (data += chunk));
            res.on('end', () => resolve(JSON.parse(data)));
          }
        ).end(TwitchHelper.generateUrl(streamers));
      }
    );
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
  private async accessTokenRequest(callback: () => void): Promise<void> {
    const params = new URLSearchParams();
    params.append('client_id', Settings.getSettings()['twitch-id']);
    params.append('client_secret', process.env.TWITCH_TOKEN!);
    params.append('grant_type', 'client_credentials');
    request(
      {
        host: 'id.twitch.tv',
        path: `/oauth2/token`,
        method: 'POST',
      },
      (res: IncomingMessage) => {
        let data: string = '';
        res.on('error', console.error);
        res.on('data', (chunk: Buffer): string => (data += chunk));
        res.on('end', () => {
          this.#accessToken = JSON.parse(data).access_token;
          callback();
        });
      }
    ).end(params.toString());
  }
}
