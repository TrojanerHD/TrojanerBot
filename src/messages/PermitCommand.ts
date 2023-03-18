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
    description: 'Manage roles that are able to execute admin commands',
    options: [
      {
        type: 1,
        name: 'manage',
        description: 'Add/remove a permitted role',
        options: [
          {
            type: 3,
            name: 'option',
            description: 'Whether to add or remove',
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
      },
      {
        type: 1,
        name: 'list',
        description: 'List all permitted roles',
        options: [],
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
      case 'manage':
        const options: CommandInteractionOption<CacheType>[] = args[0].options!;
        const newRoleId: string = options[1].role!.id;
        const newRoleIdFormatted: string = `<@&${newRoleId}>`;

        const alreadyAdded: boolean = info.permissionRoles.some(
          (role: string): boolean => newRoleId === role
        );
        switch (options[0].value) {
          case 'add':
            if (alreadyAdded) {
              interaction
                .reply({
                  content: `Role ${newRoleIdFormatted} is already a permitted role`,
                  ephemeral: true,
                })
                .catch(console.error);
              return;
            }

            info.permissionRoles.push(newRoleId);
            interaction
              .reply({
                content: `The role ${newRoleIdFormatted} has been added as a permitted role`,
                ephemeral: true,
              })
              .catch(console.error);
            break;
          case 'remove':
            if (!alreadyAdded) {
              interaction
                .reply({
                  content: `Role ${newRoleIdFormatted} is not a permitted role`,
                  ephemeral: true,
                })
                .catch(console.error);
              return;
            }

            info.permissionRoles = info.permissionRoles.filter(
              (role: string) => newRoleId !== role
            );
            interaction
              .reply({
                content: `Role ${newRoleIdFormatted} has been removed from the permitted roles`,
                ephemeral: true,
              })
              .catch(console.error);
            break;
        }
        break;
      case 'list':
        if (info.permissionRoles.length === 0) {
          interaction
            .reply({
              content: 'Currently, no roles are permitted',
              ephemeral: true,
            })
            .catch(console.error);
          return;
        }
        interaction
          .reply({
            content: `Currently, the following roles are permitted: ${info.permissionRoles
              .map((role: string) => `<@&${role}>`)
              .join(', ')}`,
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
