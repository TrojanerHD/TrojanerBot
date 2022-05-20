import { ButtonInteraction, GuildMember, Role } from 'discord.js';
import ReactionHandler from '../ReactionHandler';
import { RolesField } from '../Settings';

export default class RoleAssigner {
  #member: GuildMember;
  #parent: ReactionHandler;
  #interaction: ButtonInteraction;

  constructor(
    interaction: ButtonInteraction,
    role: RolesField,
    parent: ReactionHandler
  ) {
    this.#interaction = interaction;
    this.#member = interaction.member as GuildMember;
    this.#parent = parent;

    const guildRole: Role | undefined = this.#member.guild.roles.cache.find(
      (guildRole: Role): boolean => guildRole.name === role.name
    );
    if (!guildRole) {
      this.#member.guild.roles
        .create({ name: role.name, mentionable: true })
        .then(this.guildRoleEstablished.bind(this))
        .catch(console.error);
      return;
    }
    this.guildRoleEstablished(guildRole);
  }

  private guildRoleEstablished(role: Role): void {
    if (
      !this.#member.roles.cache.some(
        (memberRole: Role): boolean => memberRole.id === role.id
      )
    )
      this.#member.roles
        .add(role)
        .then(
          (): Promise<void> => this.#parent.editRoleReply(this.#interaction)
        )
        .catch(console.error);
    else
      this.#member.roles
        .remove(role)
        .then(
          (): Promise<void> => this.#parent.editRoleReply(this.#interaction)
        )
        .catch(console.error);
  }
}
