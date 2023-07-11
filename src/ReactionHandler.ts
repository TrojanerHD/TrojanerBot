import {
  ButtonInteraction,
  ButtonStyle,
  GuildMember,
  GuildMemberRoleManager,
  Interaction,
  Role,
} from 'discord.js';
import DiscordClient from './DiscordClient';
import assignRoles from './roles/assignRoles';
import MessageHandler from './messages/MessageHandler';
import { RolesField } from './settings/SettingsDB';
import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';

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
  private async onReaction(interaction: Interaction): Promise<void> {
    // Checks whether the interaction was a button
    if (interaction.isButton()) {
      // If the id of the button is a role name, the interaction's origin is from the role picker
      const settingsRole: RolesField | undefined = interaction.guildId
        ? (await GuildSettings.settings(interaction.guildId)).roles.find(
            (role: RolesField): boolean =>
              role.name.toLowerCase() === interaction.customId
          )
        : undefined;
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
              components: await this.generateRoleSelectorComponent(
                interaction.guildId,
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
  private async generateRoleSelectorComponent(
    guild: string | null,
    member: GuildMember | null
  ): Promise<ActionRowBuilder<ButtonBuilder>[]> {
    const messageActionRows: ActionRowBuilder<ButtonBuilder>[] = [];
    if (guild === null) return [];

    const roles: RolesField[] = (await GuildSettings.settings(guild)).roles;
    // Every row can contain up to five roles
    for (let i = 0; i < roles.length / 5; i++) {
      // Add the current five roles as component
      const currentMessageActionRow: ActionRowBuilder<ButtonBuilder> =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          roles.slice(i * 5, i * 5 + 5).map(
            // Map the roles stored in settings
            (role: RolesField): ButtonBuilder =>
              new ButtonBuilder()
                .setCustomId(role.name.toLowerCase())
                .setLabel(role.name)
                .setStyle(
                  !(member?.roles as GuildMemberRoleManager).cache.some(
                    (memberRole: Role): boolean => memberRole.name === role.name
                  )
                    ? ButtonStyle.Secondary //If member does not have the role
                    : ButtonStyle.Primary //If member has the role
                )
                .setEmoji(
                  ReactionHandler.containsEmoji(role.emoji)
                    ? { name: role.emoji }
                    : { id: role.emoji }
                )
          )
        );
      messageActionRows.push(currentMessageActionRow);
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
        components: await this.generateRoleSelectorComponent(
          interaction.guildId,
          interaction.member as GuildMember | null
        ),
      })
      .catch(console.error);
  }

  /**
   * Checks given string if it contains an emoji
   * @link https://stackoverflow.com/a/41164587
   * @param emojiLike The string to check
   * @returns Whether the string contains an emoji
   */
  static containsEmoji(emojiLike: string): boolean {
    return (
      emojiLike.match(
        /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
      ) !== null
    );
  }
}
