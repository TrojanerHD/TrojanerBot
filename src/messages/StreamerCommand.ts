import Command, { Reply } from './Command';
import {
  ApplicationCommandData,
  CommandInteractionOption,
  Interaction,
} from 'discord.js';
import Settings from '../Settings';
import DMManager from '../twitch/DMManager';

export interface Channel {
  streamer: string;
  subscribers: string[];
  sent: boolean;
}

export default class StreamerCommand extends Command {
  deploy: ApplicationCommandData = {
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

  constructor() {
    super();
  }

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
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
    const streamer: string = (
      args[0].options![1].value as string
    ).toLowerCase();
    let streamChannel: Channel | undefined = StreamerCommand._streamers.find(
      (channel: Channel) => channel.streamer === streamer
    );
    switch (args[0].options![0].value) {
      case 'add':
        if (!streamChannel) {
          streamChannel = { streamer, subscribers: [], sent: false };
          StreamerCommand._streamers.push(streamChannel);
        }

        if (streamChannel.subscribers.includes(interaction.user.id))
          return {
            reply: 'You have already subscribed to that channel',
            ephemeral: true,
          };

        streamChannel.subscribers.push(interaction.user.id);
        this.saveStreamers();

        new DMManager();
        return {
          reply: `${
            args[0].options![1].value
          } was successfully added to your subscription list`,
          ephemeral: true,
        };
      case 'remove':
        if (
          !streamChannel ||
          !streamChannel.subscribers.includes(interaction.user.id)
        )
          return {
            reply: 'You have not subscribed to that channel!',
            ephemeral: true,
          };

        streamChannel.subscribers = streamChannel.subscribers.filter(
          (subscriber: string) => subscriber !== interaction.user.id
        );
        if (streamChannel.subscribers.length === 0)
          StreamerCommand._streamers = StreamerCommand._streamers.filter(
            (channel: Channel) => channel.streamer !== streamChannel?.streamer
          );
        this.saveStreamers();
        new DMManager();
        return {
          reply: `${
            args[0].options![1].value
          } has been removed from your subscription list`,
          ephemeral: true,
        };
      default:
        return {
          reply: 'Option not available, something went wrong',
          ephemeral: true,
        };
    }
  }

  private saveStreamers() {
    Settings.getSettings()['streamer-subscriptions'] =
      StreamerCommand._streamers;
    Settings.saveSettings();
  }
}
