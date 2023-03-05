import {
  ChatInputApplicationCommandData,
  CommandInteractionOption,
  CacheType,
  CommandInteraction,
  Permissions,
} from 'discord.js';
import GuildSettings from '../settings/GuildSettings';
import { GuildInfo } from '../settings/SettingsDB';
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
    defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
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
                .reply({ content: `Streamer ${newStreamer} is not added` })
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
            break;
        }
        GuildSettings.saveSettings(interaction.guild!, info);
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
