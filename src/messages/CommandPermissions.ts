import {
  ApplicationCommandPermissionData,
  Collection,
  Guild,
  Role,
  Snowflake,
} from 'discord.js';
import Settings from '../Settings';
import { ApplicationCommandType } from './MessageHandler';

export default class CommandPermissions {
  #guild: Guild;

  constructor(guild: Guild) {
    this.#guild = guild;
  }

  onCommandsSet(commands: Collection<Snowflake, ApplicationCommandType>) {
    for (const command of commands.toJSON())
      if (!command.defaultPermission)
        command.permissions
          .add({
            guild: this.#guild,
            permissions: Settings.getSettings()
              ['permission-roles'].filter(
                (roleName: string): boolean =>
                  !!this.#guild?.roles.cache.find(
                    (role: Role): boolean => role.name === roleName
                  )
              )
              .map(
                (roleName: string): ApplicationCommandPermissionData => ({
                  id: this.#guild?.roles.cache.find(
                    (role: Role) => role.name === roleName
                  )!.id!,
                  permission: true,
                  type: 'ROLE',
                })
              ),
          })
          .catch(console.error);
  }
}
