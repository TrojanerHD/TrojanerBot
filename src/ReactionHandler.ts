import {
  ButtonInteraction,
  GuildMember,
  GuildMemberRoleManager,
  Interaction,
  MessageActionRow,
  MessageActionRowComponentResolvable,
  Role,
} from 'discord.js';
import DiscordClient from './DiscordClient';
import assignRoles from './roles/assignRoles';
import MessageHandler from './messages/MessageHandler';
import Settings, { RolesField } from './Settings';

/**
 * Handles reactions (button presses, slash-commands)
 */
export default class ReactionHandler {
  #roleSelect: ButtonInteraction[] = [];

  constructor() {
    DiscordClient._client.on('interactionCreate', this.onReaction.bind(this));
  }

  /**
   * Fires whenever an interaction has been made
   * @param interaction The interaction that has happened
   */
  private onReaction(interaction: Interaction): void {
    // Checks whether the interaction was a button
    if (interaction.isButton()) {
      // If the id of the button is a role name, the interaction's origin is from the role picker
      const settingsRole: RolesField | undefined = Settings.settings.roles.find(
        (role: RolesField): boolean =>
          role.name.toLowerCase() === interaction.customId
      );
      if (settingsRole !== undefined) {
        // Hack to not reply with anything
        interaction.reply({}).catch((reason: any): void => {
          if (reason.code !== 50006) console.error(reason);
        });
        const roleSelect: ButtonInteraction = this.#roleSelect.find(
          (roleInteraction: ButtonInteraction): boolean =>
            (roleInteraction.member as GuildMember).id ===
            (interaction.member as GuildMember).id
        )!;
        assignRoles(roleSelect, settingsRole, this);
        return;
      }
      // Get the context of the button interaction
      switch (interaction.customId) {
        // Context is button that opens the role selector
        case 'select':
          const roleSelectIndex: number = this.#roleSelect.findIndex(
            (roleInteraction: ButtonInteraction): boolean =>
              (roleInteraction.member as GuildMember).id ===
              (interaction.member as GuildMember).id
          );
          if (roleSelectIndex === -1) this.#roleSelect.push(interaction);
          else this.#roleSelect[roleSelectIndex] = interaction;
          // Create the role selector reply
          interaction
            .reply({
              content: 'Select your roles',
              components: this.generateRoleSelectorComponent(
                interaction.member as GuildMember | null
              ),
              ephemeral: true,
            })
            .catch(console.error);
          break;
      }
      return;
    }
    // If the interaction is a command, it is being handled by the correct command object
    if (!interaction.isCommand()) return;
    for (const command of MessageHandler._commands)
      if (command.deploy.name === interaction.commandName)
        command.handleCommand(interaction.options.data, interaction);
  }

  /**
   * Generates a role selector component with all selectable roles
   * @param member The guild member the selector is created for
   * @returns A message action row array containing all selectable roles
   */
  private generateRoleSelectorComponent(member: GuildMember | null): MessageActionRow[] {
    const messageActionRows: MessageActionRow[] = [];
    let currentMessageActionRow: MessageActionRow;
    // Every row can contain up to five roles
    for (let i = 0; i < Settings.settings.roles.length / 5; i++) {
      currentMessageActionRow = new MessageActionRow();
      messageActionRows.push(currentMessageActionRow);
      // Add the current five roles as component
      currentMessageActionRow.addComponents(
        Settings.settings.roles.slice(i * 5, i * 5 + 5).map(
          // Map the roles stored in settings
          (role: RolesField): MessageActionRowComponentResolvable => ({
            customId: role.name.toLowerCase(),
            label: role.name,
            style: !(member?.roles as GuildMemberRoleManager).cache.some(
              (memberRole: Role): boolean => memberRole.name === role.name
            )
              ? 'SECONDARY' //If member does not have the role
              : 'PRIMARY', //If member has the role
            type: 'BUTTON',
            emoji: role.emoji,
          })
        )
      );
    }
    return messageActionRows;
  }

  /**
   * Updates the role selector
   * @param interaction The button interaction of the role selector
   */
  async editRoleReply(interaction: ButtonInteraction): Promise<void> {
    await (interaction.member as GuildMember).fetch();
    interaction
      .editReply({
        content: 'Select your roles',
        components: this.generateRoleSelectorComponent(
          interaction.member as GuildMember | null
        ),
      })
      .catch(console.error);
  }
}
