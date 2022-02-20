import Command, { Reply } from './Command';
import {
  ChatInputApplicationCommandData,
  CommandInteractionOption,
  Interaction,
} from 'discord.js';
import Settings from '../Settings';
import DMManager from '../twitch/DMManager';

export interface Channel {
  streamer: string;
  subscribers: string[];
  sent: boolean;
  'started-at'?: string;
}

export default class StreamerCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'streamer',
    description:
      'Lets you subscribe to Twitch streamers and get a DM whenever they go live (not yet implemented)',
    options: [
      {
        type: 1,
        name: 'manage',
        description: 'Manage the streamers',
        options: [
          {
            type: 3,
            name: 'option',
            description: 'Add/remove a streamer',
            required: true,
            choices: [
              {
                name: 'add',
                value: 'add',
              },
              {
                name: 'remove',
                value: 'remove',
              },
            ],
          },
          {
            type: 3,
            name: 'streamer',
            description: 'The streamer to manage',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: 'list',
        description: 'List all streamers you have subscribed to',
        options: [],
      },
    ],
  };
  static _streamers: Channel[];

  #interaction?: Interaction;

  constructor() {
    super();
  }

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    this.#interaction = interaction;
    StreamerCommand._streamers =
      Settings.getSettings()['streamer-subscriptions'];
    if (args[0].name === 'list') {
      const streamerList: Channel[] = StreamerCommand._streamers.filter(
        (streamer: Channel): boolean =>
          streamer.subscribers.includes(interaction.user.id)
      );
      if (!streamerList || streamerList.length === 0)
        return {
          reply: 'You have not subscribed to any streamer',
          ephemeral: true,
        };
      return {
        reply: `You have subscribed to ${streamerList
          .map((value: Channel): string => value.streamer)
          .join(', ')}`,
        ephemeral: true,
      };
    }
    const streamers: string[] = (args[0].options![1].value as string)
      .toLowerCase()
      .split(/\s*\,\s*/g);
    let reply: string = '';
    switch (args[0].options![0].value) {
      case 'add':
        for (const streamer of streamers)
          reply += `${this.addChannel(streamer)}, `;
        break;
      case 'remove':
        for (const streamer of streamers)
          reply += `${this.removeChannel(streamer)}, `;
          reply = reply.replace(/, $/, '')
        break;
      default:
        reply = 'Option not available, something went wrong';
        break;
    }
    return { reply, ephemeral: true };
  }

  private findStreamChannel(streamer: string): Channel | undefined {
    return StreamerCommand._streamers.find(
      (channel: Channel) => channel.streamer === streamer
    );
  }

  private addChannel(streamer: string): string {
    let streamChannel: Channel | undefined = this.findStreamChannel(streamer);
    if (!streamer.match(DMManager.validNameRegex))
      return `${streamer} cannot be a streamer since Twitch does not allow user names with some characters`;

    if (!streamChannel) {
      streamChannel = { streamer, subscribers: [], sent: false };
      StreamerCommand._streamers.push(streamChannel);
    }

    if (streamChannel.subscribers.includes(this.#interaction!.user.id))
      return `You have already subscribed to the channel ${streamer}`;

    streamChannel.subscribers.push(this.#interaction!.user.id);
    this.saveStreamers();

    return `${streamer} was successfully added to your subscription list`;
  }

  private removeChannel(streamer: string): string {
    let streamChannel: Channel | undefined = this.findStreamChannel(streamer);
    if (
      !streamChannel ||
      !streamChannel.subscribers.includes(this.#interaction!.user.id)
    )
      return `You have not subscribed to the channel ${streamer}`;

    streamChannel.subscribers = streamChannel.subscribers.filter(
      (subscriber: string) => subscriber !== this.#interaction!.user.id
    );
    if (streamChannel.subscribers.length === 0)
      StreamerCommand._streamers = StreamerCommand._streamers.filter(
        (channel: Channel) => channel.streamer !== streamChannel?.streamer
      );
    this.saveStreamers();
    return `${streamer} has been removed from your subscription list`;
  }

  private saveStreamers(): void {
    Settings.getSettings()['streamer-subscriptions'] =
      StreamerCommand._streamers;
    Settings.saveSettings();
  }
}
