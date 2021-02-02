import STATICTWITCH from './STATICTWITCH';
import CreateEmbed from './CreateEmbed';
import Settings from '../Settings';
import fetch, { Response } from 'node-fetch';

interface Game {
  name: string;
  id: string;
}

interface Stream {
  game_id: string;
  user_name: string;
  title: string;
  viewer_count: number;
}

export default class LiveChannel {
  /** URL for fetching all added streamers via Twitch api */
  private _streamers: string | undefined;
  /** The access token for the Twitch api */
  private _accessToken: string | undefined;
  private _streams: Stream[] = [];

  /**
   * Handles the #live channel
   */
  constructor() {
    this.update();
  }

  /**
   * Sets the timeout for the update function
   */
  private timeout(): void {
    setTimeout(this.update.bind(this), 5000);
  }

  /**
   * Fetches the current state of streams and updates the embed in #live if there is an update
   */
  private update(): void {
    this._streamers = this.generateUrl(
      'streams',
      'user_login',
      Settings.getSettings().streamers
    );
    if (this._accessToken === undefined)
      this.accessTokenRequest(this.channelRequest.bind(this));
    else this.channelRequest();
    this.timeout();
  }

  /**
   * Creates a request for fetching updates from streamers from Twitch
   */
  private channelRequest(): void {
    fetch(this._streamers!, {
      headers: {
        'Client-ID': Settings.getSettings()['twitch-id'],
        Authorization: `Bearer ${this._accessToken}`,
      },
    })
      .then((res: Response) => res.json())
      .catch(console.error)
      .then((data: any) => this.streamerFetch(data))
      .catch(console.error);
  }

  /**
   * Callback for channelRequest.
   * Creates a request to resolve the game ids of the games the streamers are playing
   * @param body Updated content
   */
  private streamerFetch(body: { data: Stream[] }): void {
    if ('error' in body) {
      console.error(
        `Error in LiveChannel.ts on line 74:\n${JSON.stringify(body, null, 2)}`
      );
      return;
    }
    this._streams = body.data;
    let games: Set<string> = new Set();
    for (const stream of body.data) games.add(stream.game_id);

    const gameUrl: string = this.generateUrl('games', 'id', games);
    fetch(gameUrl, {
      headers: {
        'Client-ID': Settings.getSettings()['twitch-id'],
        Authorization: `Bearer ${this._accessToken}`,
      },
    })
      .then((res: Response) => res.json())
      .catch(console.error)
      .then(this.gameIdResult.bind(this))
      .catch(console.error);
  }

  /**
   * Callback for the game id resolving
   * @param body Game properties
   */
  private gameIdResult(body: { data: Game[] }): void {
    const createEmbed = new CreateEmbed();
    for (const stream of this._streams) {
      let game: string | undefined = body.data.find(
        (game: Game) => game.id === stream.game_id
      )?.name;

      createEmbed.addField({
        game,
        name: stream.user_name,
        title: stream.title,
        viewer_count: stream.viewer_count,
      });
    }
    createEmbed.sendEmbed();
  }

  /**
   * Creates a url for the Twitch API to fetch
   * @param endpoint The endpoint to use
   * @param parameter
   * @param array All games or streamers
   * @returns The formatted url
   */
  private generateUrl(
    endpoint: 'games' | 'streams',
    parameter: 'user_login' | 'id',
    array: string[] | Set<string>
  ): string {
    let url = `${STATICTWITCH.baseUrl}helix/${endpoint}?`;
    for (const value of array) url += `${parameter}=${value}&`;
    return url.replace(/&$/, '');
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
        this._accessToken = data.access_token;
        callback();
      });
  }
}
