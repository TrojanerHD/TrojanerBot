import {
  Collection,
  Guild,
  GuildMember,
  MessageReaction,
  Role,
  RoleManager,
  User,
} from 'discord.js';
import Settings from '../Settings';
import GuildRolesManager from './GuildRolesManager';
import { CustomRole } from './RoleChannelManager';

export default class RoleAssigner {
  #reaction: MessageReaction;
  #guild: Guild;
  #members?: GuildMember[];
  #roles?: Role[];
  #block: boolean = false;
  #parent: GuildRolesManager;

  constructor(reaction: MessageReaction, guild: Guild, parent: GuildRolesManager) {
    this.#reaction = reaction;
    this.#guild = guild;
    this.#parent = parent;
  }

  membersFetched(members: Collection<string, GuildMember>): void {
    this.#members = members.array();
    this.#guild.roles.fetch().then(this.rolesFetched.bind(this));
  }

  private rolesFetched(roles: Collection<`${bigint}`, Role>): void {
    if (this.#block) return;
    this.#roles = roles.array();

    this.#reaction.users.fetch()
      .then(this.reactorsFetched.bind(this))
      .catch(console.error);
  }

  private reactorsFetched(reactors: Collection<string, User>): void {
    const roleName: string | undefined = Settings.getSettings().roles.find(
      (role: CustomRole) =>
        role.emoji === this.#reaction.emoji.id ||
        role.emoji === this.#reaction.emoji.name
    )?.name;
    let role: Role | undefined = this.#roles!.find(
      (role: Role) => role.name === roleName
    );
    if (!role) {
      this.#guild.roles
        .create({
          name: roleName, mentionable: true
        })
        .then(() => {
          this.#block = false;
          this.#parent.checkRoles(this.#reaction);
        })
        .catch(console.error);
      this.#block = true;
      return;
    }
    for (const member of this.#members!) {
      const user: User = member.user;
      if (user.bot) continue;
      if (
        member.roles.cache.array().includes(role) &&
        !reactors.array().includes(user)
      )
        member.roles.remove(role);
      if (
        !member.roles.cache.array().includes(role) &&
        reactors.array().includes(user)
      )
        member.roles.add(role);
    }
  }
}
