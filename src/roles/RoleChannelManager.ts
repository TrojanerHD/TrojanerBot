import {
  DMChannel,
  EmbedFieldData,
  Guild,
  GuildChannel,
  MessageEmbed,
  NewsChannel,
  NonThreadGuildBasedChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import manageRoles from './manageRoles';
import { GuildTextChannel } from '../messages/Command';
import { RolesField } from '../settings/SettingsDB';
import GuildSettings from '../settings/GuildSettings';

/**
 * Manages the roles for each user with a message with button in a channel
 */
export default class RoleChannelManager {
  public _guild: Guild;
  public _channel?: GuildTextChannel;
  public static mgrs: RoleChannelManager[] = [];

  constructor(guild: Guild) {
    this._guild = guild;
    RoleChannelManager.mgrs.push(this);
  }

  public async run() {
    const rolesChannel: GuildTextChannel | undefined =
      this._channel ??
      (this._guild.channels.cache.find(
        (channel: GuildChannel | ThreadChannel): boolean =>
          channel.name === 'roles' &&
          (channel instanceof TextChannel ||
            channel instanceof ThreadChannel ||
            channel instanceof NewsChannel)
      ) as GuildTextChannel | undefined);
    if (!rolesChannel) return;

    this._channel = rolesChannel;

    const embed: MessageEmbed = await this.generateEmbed();

    manageRoles(rolesChannel, embed);
  }

  private async generateEmbed(): Promise<MessageEmbed> {
    const roles: RolesField[] = (await GuildSettings.settings(this._guild.id))
      .roles;

    const errorRole: boolean = roles.some(
      (role: RolesField): boolean => !role.emoji || !role.name
    );
    if (errorRole)
      return new MessageEmbed()
        .setTimestamp(Date.now())
        .setTitle('Role Selector')
        .setDescription(
          'Error: All fields in `role` in `settings.json` must have a `name` and `emoji` tag'
        )
        .setColor('RED');
    return new MessageEmbed()
      .setTimestamp(Date.now())
      .setTitle('Role Selector')
      .setFields(
        roles.map(
          (role: RolesField): EmbedFieldData => ({
            name: role.name,
            value: role.description || '*No description provided*',
          })
        )
      );
  }

  /**
   * Removes the roles channel if it was deleted
   * @param channel The deleted channel
   */
  public onChannelDelete(channel: NonThreadGuildBasedChannel): void {
    if (this._channel !== undefined && this._channel.id === channel.id)
      this._channel = undefined;
    this.run();
  }

  /**
   * Removes the roles channel if it has been renamed
   *
   * Retries the role channel manager (also implicitly checks if the new
   * channel has been renamed to #roles if there was no roles channel
   * before)
   * @param oldChannel The old channel
   * @param newChannel The new channel
   */
  public onChannelUpdate(
    oldChannel: NonThreadGuildBasedChannel,
    newChannel: NonThreadGuildBasedChannel
  ): void {
    if (oldChannel.name === newChannel.name) return;
    if (this._channel !== undefined && this._channel.id === oldChannel.id)
      this._channel = undefined;
    this.run();
  }
}
