import fetch, { Response } from 'node-fetch';
import Settings from '../Settings';

export interface Category {
  name: string;
  id: string;
}

export interface Stream {
  game_id: string;
  user_name: string;
  user_login: string;
  title: string;
  viewer_count: number;
  category?: string;
  started_at: string;
}

export interface StreamData {
  data: Stream[];
}

export default class TwitchHelper {
  /** URL for fetching all added streamers via Twitch api */
  #streamers?: string;
  /** The access token for the Twitch api */
  #accessToken?: string;
  _streamerUpdate: string[] = [];
  #streams: Stream[] = [];
  #callback: (streams: Stream[]) => void;

  constructor(callback: (streams: Stream[]) => void) {
    this.#callback = callback;
  }

  /**
   * Creates a url for the Twitch API to fetch
   * @param endpoint The endpoint to use
   * @param streamers All categories or streamers to fetch
   * @returns The formatted url
   */
  static generateUrl(
    endpoint: 'games' | 'streams',
    streamers: string[]
  ): string {
    const type: string = endpoint === 'games' ? 'id' : 'user_login';
    return `https://api.twitch.tv/helix/${endpoint}?${streamers
      .map((streamer: string): string => `${type}=${streamer.toLowerCase()}`)
      .join('&')}`;
  }
  /**
   * Fetches the current state of streams
   * @param streamerUpdate The streamers to fetch
   */
  update(streamerUpdate?: string[]): void {
    if (streamerUpdate !== undefined) this._streamerUpdate = streamerUpdate;
    if (this._streamerUpdate.length === 0) {
      this.timeout();
      return;
    }
    this.#streamers = TwitchHelper.generateUrl('streams', this._streamerUpdate);
    if (!this.#accessToken)
      this.accessTokenRequest(this.channelRequest.bind(this));
    else this.channelRequest();
    this.timeout();
  }

  /**
   * Creates a request for fetching updates from streamers from Twitch
   */
  private channelRequest(): void {
    fetch(this.#streamers!, {
      headers: {
        'Client-ID': Settings.getSettings()['twitch-id'],
        Authorization: `Bearer ${this.#accessToken}`,
      },
    })
      .then((res: Response) => res.json())
      .catch(console.error)
      .then((data: StreamData) => this.streamerFetch(data))
      .catch(console.error);
  }

  /**
   * Callback for channelRequest.
   * Creates a request to resolve the category ids of the categories the streamers are streaming
   * @param stream Updated content
   */
  private streamerFetch(stream: StreamData): void {
    if (!stream) {
      console.error(
        'Error in TwitchHelper.ts on line 87:\nstream is undefined'
      );
      return;
    }
    if ('error' in stream) {
      console.error(
        `Error in TwitchHelper.ts on line 88:\n${JSON.stringify(
          stream,
          null,
          2
        )}`
      );
      return;
    }
    this.#streams = stream.data;
    this.#streams.sort((a: Stream, b: Stream) => {
      for (const streamer of Settings.getSettings().streamers) {
        if (a.user_name === streamer) return -1;
        if (b.user_name === streamer) return 1;
      }
      return 0;
    });

    let categories: string[] = [];
    for (const stream of this.#streams) categories.push(stream.game_id);

    const categoryUrl: string = TwitchHelper.generateUrl('games', categories);
    fetch(categoryUrl, {
      headers: {
        'Client-ID': Settings.getSettings()['twitch-id'],
        Authorization: `Bearer ${this.#accessToken}`,
      },
    })
      .then((res: Response) => res.json())
      .catch(console.error)
      .then(this.categoryIdResult.bind(this))
      .catch(console.error);
  }

  /**
   * Callback for the category id resolving
   * @param streams Category properties
   */
  private categoryIdResult(body: { data: Category[] }) {
    for (const stream of this.#streams)
      stream.category = body.data.find(
        (category: Category): boolean => category.id === stream.game_id
      )?.name;
    this.#callback(this.#streams);
  }

  /**
   * Sets the timeout for the update function
   */
  private timeout(): void {
    setTimeout(this.update.bind(this), 5000);
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
