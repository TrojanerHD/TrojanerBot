import Command from './Command';
import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOption,
} from 'discord.js';
import Settings from '../Settings';
import DMManager from '../twitch/DMManager';
import Common from '../common';

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
      'Lets you subscribe to Twitch streamers and get a DM whenever they go live',
    options: [
      {
        type: 1,
        name: 'manage',
        description:
          'Lets you subscribe to Twitch streamers and get a DM whenever they go live',
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

  #interaction?: CommandInteraction;

  constructor() {
    super();
  }

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: CommandInteraction
  ): void {
    this.#interaction = interaction;
    StreamerCommand._streamers =
      Settings.getSettings()['streamer-subscriptions'];
    if (args[0].name === 'list') {
      const streamerList: Channel[] = StreamerCommand._streamers.filter(
        (streamer: Channel): boolean =>
          streamer.subscribers.includes(interaction.user.id)
      );
      if (!streamerList || streamerList.length === 0) {
        interaction
          .reply({
            content: 'You have not subscribed to any streamer',
            ephemeral: true,
          })
          .catch(console.error);
        return;
      }
      interaction
        .reply({
          content: `You have subscribed to ${streamerList
            .map((value: Channel): string => Common.sanitize(value.streamer))
            .join(', ')}`,
          ephemeral: true,
        })
        .catch(console.error);
      return;
    }
    const streamers: string[] = (args[0].options![1].value as string)
      .toLowerCase()
      .split(/\s*\,\s*/g);
    let content: string = '';
    switch (args[0].options![0].value) {
      case 'add':
        for (const streamer of streamers)
          content += `${this.addChannel(streamer)}\n`;
        break;
      case 'remove':
        for (const streamer of streamers)
          content += `${this.removeChannel(streamer)}\n`;
        break;
      default:
        content = 'Option not available, something went wrong';
        break;
    }
    interaction.reply({ content, ephemeral: true }).catch(console.error);
  }

  private findStreamChannel(streamer: string): Channel | undefined {
    return StreamerCommand._streamers.find(
      (channel: Channel): boolean => channel.streamer === streamer
    );
  }

  private addChannel(streamer: string): string {
    let streamChannel: Channel | undefined = this.findStreamChannel(streamer);
    if (!streamer.match(DMManager.validNameRegex))
      return `${Common.sanitize(
        streamer
      )} cannot be a streamer since Twitch does not allow user names with some characters`;

    if (!streamChannel) {
      streamChannel = { streamer, subscribers: [], sent: false };
      StreamerCommand._streamers.push(streamChannel);
    }

    if (streamChannel.subscribers.includes(this.#interaction!.user.id))
      return `You have already subscribed to the channel ${Common.sanitize(
        streamer
      )}`;

    streamChannel.subscribers.push(this.#interaction!.user.id);
    this.saveStreamers();

    return `${Common.sanitize(
      streamer
    )} was successfully added to your subscription list`;
  }

  private removeChannel(streamer: string): string {
    let streamChannel: Channel | undefined = this.findStreamChannel(streamer);
    if (
      !streamChannel ||
      !streamChannel.subscribers.includes(this.#interaction!.user.id)
    )
      return `You have not subscribed to the channel ${Common.sanitize(
        streamer
      )}`;

    streamChannel.subscribers = streamChannel.subscribers.filter(
      (subscriber: string): boolean => subscriber !== this.#interaction!.user.id
    );
    if (streamChannel.subscribers.length === 0)
      StreamerCommand._streamers = StreamerCommand._streamers.filter(
        (channel: Channel): boolean =>
          channel.streamer !== streamChannel?.streamer
      );
    this.saveStreamers();
    return `${Common.sanitize(
      streamer
    )} has been removed from your subscription list`;
  }

  private saveStreamers(): void {
    Settings.getSettings()['streamer-subscriptions'] =
      StreamerCommand._streamers;
    Settings.saveSettings();
  }
}
