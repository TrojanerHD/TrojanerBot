import { APIGuildMember } from 'discord-api-types';
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
import { Reply } from './messages/Command';
import RoleAssigner from './roles/RoleAssigner';
import MessageHandler from './messages/MessageHandler';
import Settings, { RolesField } from './Settings';

export default class ReactionHandler {
  #roleSelect: ButtonInteraction[] = [];

  constructor() {
    DiscordClient._client.on('interactionCreate', this.onReaction.bind(this));
  }

  private onReaction(interaction: Interaction): void {
    if (interaction.isButton()) {
      const settingsRole: RolesField | undefined =
        Settings.getSettings().roles.find(
          (role: RolesField): boolean =>
            role.name.toLowerCase() === interaction.customId
        );
      if (!!settingsRole) {
        interaction.reply({}).catch((reason: any): void => {
          if (reason.code !== 50006) console.error(reason);
        });
        const roleSelect: ButtonInteraction = this.#roleSelect.find(
          (roleInteraction: ButtonInteraction) =>
            (roleInteraction.member as GuildMember).id ===
            (interaction.member as GuildMember).id
        )!;
        new RoleAssigner(roleSelect, settingsRole, this);
        return;
      }
      switch (interaction.customId) {
        case 'select':
          if (
            !this.#roleSelect.find(
              (roleInteraction: ButtonInteraction, index: number): boolean => {
                if (
                  (roleInteraction.member as GuildMember).id ===
                  (interaction.member as GuildMember).id
                ) {
                  this.#roleSelect[index] = interaction;
                  return true;
                }
                return false;
              }
            )
          )
            this.#roleSelect.push(interaction);
          interaction
            .reply({
              //Create a reply
              content: 'Select your roles', // Reply content
              components: this.createComponent(interaction.member),
              ephemeral: true,
            })
            .catch(console.error);
          break;
      }
      return;
    }
    if (!interaction.isCommand()) return;
    for (const command of MessageHandler._commands)
      if (command.deploy.name === interaction.commandName) {
        const reply: Reply = command.handleCommand(
          interaction.options.data,
          interaction
        );
        if (!reply.ephemeral) reply.ephemeral = false;
        if (!reply.afterResponse) reply.afterResponse = (): void => {};
        interaction
          .reply({ content: reply.reply, ephemeral: reply.ephemeral })
          .then(reply.afterResponse.bind(command))
          .catch(console.error);
      }
  }
  private createComponent(
    member: GuildMember | APIGuildMember | null
  ): MessageActionRow[] {
    const messageActionRows: MessageActionRow[] = [];
    let currentMessageActionRow: MessageActionRow;
    for (let i = 0; i < Settings.getSettings().roles.length / 5; i++) {
      currentMessageActionRow = new MessageActionRow();
      messageActionRows.push(currentMessageActionRow);
      currentMessageActionRow.addComponents(
        Settings.getSettings()
          .roles.slice(i * 5, i * 5 + 5)
          .map(
            // Map the roles stored in settings
            (role: RolesField): MessageActionRowComponentResolvable => ({
              customId: role.name.toLowerCase(),
              label: role.name,
              style: !(member?.roles as GuildMemberRoleManager).cache.find(
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

  async editRoleReply(interaction: ButtonInteraction): Promise<void> {
    await (interaction.member as GuildMember).fetch();
    interaction
      .editReply({
        content: 'Select your roles',
        components: this.createComponent(interaction.member),
      })
      .catch(console.error);
  }
}
