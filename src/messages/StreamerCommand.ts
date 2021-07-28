import Command, { DeploymentOptions, Reply } from './Command';
import {
  TextChannel,
  Message,
  ApplicationCommandData,
  CommandInteractionOption,
  Interaction,
} from 'discord.js';
import Settings from '../Settings';

export interface Channel {
  streamer: string;
  subscribers: string[];
}

export default class StreamerCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'streamer',
    description:
      'Lets you subscribe to Twitch streamers and get a DM whenever they go live',
    options: [
      {
        type: 1,
        name: 'add',
        description: 'Add a streamer',
        options: [
          {
            type: 3,
            name: 'streamer',
            description: 'The streamer to add',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: 'remove',
        description: 'Remove a streamer',
        options: [
          {
            type: 3,
            name: 'streamer',
            description: 'The streamer to remove',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: 'list',
        description: 'List all streamers you have subscribed to',
      },
    ],
  };
  deploymentOptions: DeploymentOptions = ['dms', 'guilds'];
  static _streamers: Channel[];

  constructor() {
    super();
    StreamerCommand._streamers =
      Settings.getSettings()['streamer-subscriptions'];
  }

  handleCommand(
    args: CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    if (args[0].name === 'list')
      return {
        reply: `You have subscribed to ${StreamerCommand._streamers
          .filter((value: Channel): boolean =>
            value.subscribers.includes(interaction.user.id)
          )
          .map((value: Channel): string => value.streamer)
          .join(', ')}`,
        ephemeral: true,
      };
    const streamer: string = (
      args[0].options?.array()[0].value as string
    ).toLowerCase();
    let streamChannel: Channel | undefined = StreamerCommand._streamers.find(
      (channel: Channel) => channel.streamer === streamer
    );
    switch (args[0].name) {
      case 'add':
        if (!streamChannel) {
          streamChannel = { streamer, subscribers: [] };
          StreamerCommand._streamers.push(streamChannel);
        }

        if (streamChannel.subscribers.includes(interaction.user.id))
          return {
            reply: 'You have already subscribed to that channel',
            ephemeral: true,
          };

        streamChannel.subscribers.push(interaction.user.id);
        this.saveStreamers();

        return {
          reply: `${
            args[0].options?.array()[0].value
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
        return {
          reply: `${
            args[0].options?.array()[0].value
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
