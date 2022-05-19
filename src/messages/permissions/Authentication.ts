import express from 'express';
import DiscordClient from '../../DiscordClient';
import { URLSearchParams } from 'url';
import { request } from 'https';
import { IncomingMessage, Server } from 'http';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token: string;
}

export default class Authentication {
  #app = express();
  #server: Server;

  constructor() {
    this.#app.get('/', async (req, res): Promise<void> => {
      res.send('Successfully authorized');
      const params = new URLSearchParams();
      params.append('client_id', DiscordClient._client.application!.id);
      params.append('client_secret', process.env.OAUTH_TOKEN!);
      params.append('grant_type', 'authorization_code');
      params.append('code', req.query.code as string);
      params.append('redirect_uri', 'http://localhost:3000');

      request(
        {
          host: 'discord.com',
          path: '/api/oauth2/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': params.toString().length,
            Authorization: `Basic ${Buffer.from(
              `${DiscordClient._client.application?.id}:${process.env.DISCORD_TOKEN}`
            ).toString('base64')}`,
          },
        },
        (res: IncomingMessage) => {
          let data: string = '';
          res.on('data', (chunk: Buffer): string => (data += chunk.toString()));
          res.on('end', (): void => {
            const json: TokenResponse = JSON.parse(data);
            console.log(json);
          });
          res.on('error', console.error);
        }
      ).write(params.toString());
      // Stop express app
      this.#server.close();
    });
    this.#server = this.#app.listen(3000);
  }
}
