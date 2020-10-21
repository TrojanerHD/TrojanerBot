import Command from './Command';
import { TextChannel, Message } from 'discord.js';
import fs from 'fs';

interface Channel {
  streamer: string;
  subscribers: string[];
}

export default class StreamerCommand extends Command {
  helpInfo: { name: string; value: string } = {
    name: '!streamer add|remove <streamer name>',
    value: 'Lets you subscribe to Twitch streamers and get a DM whenever they go live',
  };
  static _streamers: Channel[];

  constructor() {
    super();
    const streamersFile: string = './streamers-command.json';
    if (
      !fs.existsSync(streamersFile) ||
      !StreamerCommand.IsJsonString(fs.readFileSync(streamersFile).toString())
    ) {
      StreamerCommand._streamers = [];
      fs.writeFileSync(streamersFile, '[]', 'utf8');
      return;
    }
    StreamerCommand._streamers = JSON.parse(
      fs.readFileSync(streamersFile, 'utf8')
    );
  }

  handleCommand(args: string[], channel: TextChannel, message: Message): void {
    if (args.length < 2)
      //TODO: Error message
      return;

    const streamer: string = args[1].toLowerCase();
    let streamChannel: Channel | undefined = StreamerCommand._streamers.find(
      (channel: Channel) => channel.streamer === streamer
    );
    switch (args[0]) {
      case 'add':
        if (!streamChannel) {
          streamChannel = { streamer, subscribers: [] };
          StreamerCommand._streamers.push(streamChannel);
        }

        if (streamChannel.subscribers.includes(message.author.id)) {
          channel.send('You have already subscribed to that channel');
          return;
        }
        streamChannel.subscribers.push(message.author.id);
        this.saveStreamers();

        channel
          .send(`${args[1]} was successfully added to your subscription list`)
          .catch(console.error);
        break;
      case 'remove':
        if (
          !streamChannel ||
          !streamChannel.subscribers.includes(message.author.id)
        ) {
          channel.send('You have not subscribed to that channel!');
          return;
        }

        streamChannel.subscribers = streamChannel.subscribers.filter(
          (subscriber: string) => subscriber !== message.author.id
        );
        if (streamChannel.subscribers.length === 0)
          StreamerCommand._streamers = StreamerCommand._streamers.filter(
            (channel: Channel) => channel.streamer !== streamChannel?.streamer
          );
        this.saveStreamers();
        channel
          .send(`${args[1]} has been removed from your subscription list`)
          .catch(console.error);
        break;
      default:
        //TODO: Error message
        return;
    }
  }

  static IsJsonString(str: string): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  private saveStreamers() {
    fs.writeFile(
      './streamers-command.json',
      JSON.stringify(StreamerCommand._streamers),
      'utf8',
      (err: NodeJS.ErrnoException | null) => {
        if (err) console.error(err);
      }
    );
  }
}
