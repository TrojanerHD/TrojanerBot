import { ButtonInteraction, GuildMember, Role } from 'discord.js';
import ReactionHandler from '../ReactionHandler';
import { RolesField } from '../Settings';

export default async function assignRoles(
  interaction: ButtonInteraction,
  role: RolesField,
  parent: ReactionHandler
): Promise<void> {
  const member: GuildMember = interaction.member as GuildMember;
  let guildRole: Role | undefined = member.guild.roles.cache.find(
    (guildRole: Role): boolean => guildRole.name === role.name
  );
  if (guildRole === undefined) {
    const tempRole: void | Role = await member.guild.roles
      .create({ name: role.name, mentionable: true })
      .catch(console.error);
    if (tempRole === undefined) return;
    guildRole = tempRole;
  }
  if (
    !member.roles.cache.some(
      (memberRole: Role): boolean => memberRole.id === (guildRole as Role).id
    )
  )
    await member.roles.add(guildRole).catch(console.error);
  else await member.roles.remove(guildRole).catch(console.error);

  parent.editRoleReply(interaction);
}
