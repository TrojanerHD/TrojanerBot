import {
  ChatInputApplicationCommandData,
  CommandInteractionOption,
  CacheType,
  CommandInteraction,
  Collection,
  Message,
  PermissionFlagsBits,
  GuildTextBasedChannel,
} from 'discord.js';
import GuildSettings from '../settings/GuildSettings';
import { GuildInfo } from '../settings/SettingsDB';
import CreateEmbed from '../twitch/CreateEmbed';
import Command from './Command';

export default class StreamChannelCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'stream-channel',
    description: "Manage the streams shown in the guild's stream channel",
    options: [
      {
        type: 1,
        name: 'option',
        description: "Manage the streams shown in the guild's stream channel",
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
        description:
          "List all streamers that will be shown in the guild's live channel",
      },
    ],
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    dmPermission: false,
  };

  async handleCommand(
    args: readonly CommandInteractionOption<CacheType>[],
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    if (interaction.guildId === null) {
      interaction.reply({
        content: 'You are only allowed to perform this command in a guild',
        ephemeral: true,
      });
      return;
    }

    const info: GuildInfo = await GuildSettings.settings(interaction.guildId);

    switch (args[0].name) {
      case 'option':
        const newStreamer = args[0].options![1].value!.toString();

        const alreadyAdded: boolean = info.streamers.includes(newStreamer);

        switch (args[0].options![0].value) {
          case 'add':
            if (alreadyAdded) {
              interaction
                .reply({
                  content: `Streamer ${newStreamer} is already added`,
                  ephemeral: true,
                })
                .catch(console.error);
              return;
            }

            info.streamers.push(newStreamer);
            interaction
              .reply({
                content: `Streamer ${newStreamer} has been added`,
                ephemeral: true,
              })
              .catch(console.error);
            break;
          case 'remove':
            if (!alreadyAdded) {
              interaction
                .reply({
                  content: `Streamer ${newStreamer} is not added`,
                  ephemeral: true,
                })
                .catch(console.error);
              return;
            }

            info.streamers = info.streamers.filter(
              (streamer: string): boolean => newStreamer !== streamer
            );
            interaction
              .reply({
                content: `The streamer ${newStreamer} has been removed`,
                ephemeral: true,
              })
              .catch(console.error);
            if (info.streamers.length === 0) {
              const channel: GuildTextBasedChannel | undefined =
                CreateEmbed.determineLiveChannel(interaction.guild!);
              if (!channel) break;
              const messages: Collection<string, Message> | void =
                await CreateEmbed.getMessages(channel);
              if (!messages) break;
              for (const message of messages.toJSON())
                message.delete().catch(console.error);
            }
            break;
        }
        await GuildSettings.saveSettings(interaction.guild!, info).catch(
          console.error
        );
        break;
      case 'list':
        interaction
          .reply({
            content: `Currently, the following streamers will be shown: ${info.streamers.join(
              ', '
            )}`,
            ephemeral: true,
          })
          .catch(console.error);
        break;
    }
  }
}