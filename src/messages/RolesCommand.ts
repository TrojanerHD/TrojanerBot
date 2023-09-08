import {
  ChatInputApplicationCommandData,
  CommandInteractionOption,
  CacheType,
  CommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import Common from '../common';
import GuildSettings from '../settings/GuildSettings';
import { GuildInfo, RolesField } from '../settings/SettingsDB';
import Command from './Command';

export default class RolesCommand extends Command {
  deploy: ChatInputApplicationCommandData = {
    name: 'roles',
    description: 'Manage roles users can give themselves',
    options: [
      {
        type: 1,
        name: 'remove',
        description: 'Remove a role',
        options: [
          {
            type: 8,
            name: 'role',
            description: 'The role to remove',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: 'edit',
        description: 'Edit an existing role',
        options: [
          {
            type: 8,
            name: 'role',
            description: 'The role to edit',
            required: true,
          },
          {
            type: 3,
            name: 'emoji',
            description: 'The new emoji to use',
          },
          {
            type: 3,
            name: 'description',
            description: 'The new description to use',
          },
        ],
      },
      {
        type: 1,
        name: 'add',
        description: 'Add a role',
        options: [
          {
            type: 3,
            name: 'role_name',
            description: 'The name of the role to add',
            required: true,
            choices: [],
          },
          {
            type: 3,
            name: 'emoji',
            description: 'The emoji to use for the role',
            required: true,
          },
          {
            type: 3,
            name: 'description',
            description: 'The description shown in the role channel',
          },
        ],
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
      case 'add':
        const newRole: RolesField = {
          name: this.getParam(args, 0),
          emoji: this.getParam(args, 1),
        };
        if (args[0].options!.length === 3)
          newRole.description = this.getParam(args, 2);
        info.roles.push(newRole);
        interaction.reply({
          content: `The role ${newRole.name} has been added (note that the role will only be created when somebody assigns it to themselves)`,
          ephemeral: true,
        });
        break;
      case 'remove':
        if (
          !info.roles.some(
            (role: RolesField): boolean =>
              args[0].options![0].role!.name === role.name
          )
        ) {
          interaction
            .reply({
              content: `The role ${
                args[0].options![0].role!.name
              } does not exist in the role selector`,
              ephemeral: true,
            })
            .catch(console.error);
          return;
        }
        info.roles = info.roles.filter(
          (role: RolesField): boolean =>
            args[0].options![0].role!.name !== role.name
        );
        interaction
          .reply({
            content: `The role ${
              args[0].options![0].role!.name
            } has been removed from the role selector (note that it was not deleted)`,
            ephemeral: true,
          })
          .catch(console.error);
        break;
      case 'edit':
        const i: number = info.roles.findIndex(
          (role: RolesField): boolean =>
            role.name === args[0].options![0].role!.name
        );
        if (i === -1) {
          interaction
            .reply({
              content: `The role ${
                args[0].options![0].role!.name
              } does not exist in the role selector`,
            })
            .catch(console.error);
          return;
        }

        for (const option of args[0].options!.filter(
          (_: CommandInteractionOption<CacheType>, i: number): boolean =>
            i !== 0
        ))
          info.roles[i][option.name as 'emoji' | 'description'] =
            option.value!.toString();

        interaction
          .reply({
            content: `The role ${info.roles[i].name} has been edited:\ndescription: ${info.roles[i].description}\nemoji: ${info.roles[i].emoji}`,
            ephemeral: true,
          })
          .catch(console.error);
        break;
    }
    await GuildSettings.saveSettings(interaction.guild!, info).catch(
      console.error
    );
    Common.getRoleChannelManager(interaction.guild!).run();
  }

  private getParam(
    args: readonly CommandInteractionOption<CacheType>[],
    i: number
  ): string {
    return args[0].options![i].value!.toString();
  }
}
