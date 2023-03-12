import {
  ChatInputApplicationCommandData,
  CommandInteractionOption,
  CacheType,
  CommandInteraction,
  Permissions,
} from 'discord.js';
import Command from './Command';
import GuildSettings from '../settings/GuildSettings';
import { GuildInfo } from '../settings/SettingsDB';
import MessageHandler from './MessageHandler';

export default class PermitCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'permit',
    description: 'Manages roles that are able to execute admin commands',
    options: [
      {
        type: 3,
        name: 'option',
        description: 'Whether to add/remove a permitted role',
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
        type: 8,
        name: 'role',
        description: 'The role to add/remove',
        required: true,
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
    const newRole: string = args[1].value!.toString();
    const alreadyAdded: boolean = info.permissionRoles.some(
      (role: string): boolean => newRole === role
    );
    switch (args[0].value) {
      case 'add':
        if (alreadyAdded) {
          interaction
            .reply({
              content: `Role ${args[1].role!.name} is already a permitted role`,
              ephemeral: true,
            })
            .catch(console.error);
          return;
        }

        info.permissionRoles.push(newRole);
        interaction
          .reply({
            content: `The role ${
              args[1].role!.name
            } has been added as a permitted role`,
            ephemeral: true,
          })
          .catch(console.error);
        break;
      case 'remove':
        if (!alreadyAdded) {
          interaction
            .reply({
              content: `Role ${args[1].role!.name} is not a permitted role`,
              ephemeral: true,
            })
            .catch(console.error);
          return;
        }

        info.permissionRoles = info.permissionRoles.filter(
          (role: string) => newRole !== role
        );
        interaction
          .reply({
            content: `Role ${
              args[1].role!.name
            } has been removed from the permitted roles`,
            ephemeral: true,
          })
          .catch(console.error);
        break;
    }

    await GuildSettings.saveSettings(interaction.guild!, info).catch(
      console.error
    );
    MessageHandler.addCommands();
  }
}
