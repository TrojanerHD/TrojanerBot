import {
  Role,
  Snowflake,
  GuildMemberRoleManager,
  Guild,
} from 'discord.js';
import Settings from './Settings';

export default class PermissionManager {
  static _errorMessage =
    'You do not have the permission to perform this command';
  static hasPermission(
    guild: Guild,
    roles?: Snowflake[] | GuildMemberRoleManager
  ): boolean {
    if (!roles) return false;
    let roleExists: Role | undefined;
    if (roles instanceof GuildMemberRoleManager)
      roleExists = roles.cache.find((role: Role) =>
        Settings.getSettings()['permission-roles'].includes(role.name)
      );
    else {
      const roleArray: Role[] = PermissionManager.rolesFromSnowflake(
        guild,
        roles
      );
      roleExists = roleArray.find((role: Role) =>
        Settings.getSettings()['permission-roles'].includes(role.name)
      );
    }
    return !!roleExists;
  }

  private static rolesFromSnowflake(
    guild: Guild,
    snowflakes: Snowflake[]
  ): Role[] {
    let roles: Role[] = [];
    for (const snowflake of snowflakes)
      roles.push(
        guild.roles.cache.find((role: Role) => role.id === snowflake)!
      );
    return roles;
  }
}
