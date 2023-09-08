import { ButtonInteraction, GuildMember, Role } from 'discord.js';
import ReactionHandler from '../ReactionHandler';
import { RolesField } from '../settings/SettingsDB';

/**
 * The handler for when a user clicks on a role button in the role selection message
 * @param interaction The interaction of the button the user has clicked on
 * @param role The role the user is about to receive / get removed
 * @param parent The parent element that is being used to edit the role reply
 */
export default async function assignRoles(
  interaction: ButtonInteraction,
  role: RolesField,
  parent: ReactionHandler
): Promise<void> {
  const member: GuildMember = interaction.member as GuildMember;
  let guildRole: Role | undefined = member.guild.roles.cache.find(
    (guildRole: Role): boolean => guildRole.name === role.name
  );
  // If the role does not exist, create it
  if (guildRole === undefined) {
    const tempRole: void | Role = await member.guild.roles
      .create({ name: role.name, mentionable: true })
      .catch(console.error);
    if (tempRole === undefined) return;
    guildRole = tempRole;
  }
  // If the user has the role already, remove it. If not, add it
  if (
    !member.roles.cache.some(
      (memberRole: Role): boolean => memberRole.id === (guildRole as Role).id
    )
  )
    await member.roles.add(guildRole).catch(console.error);
  else await member.roles.remove(guildRole).catch(console.error);

  parent.editRoleReply(interaction);
}
