import {
  Guild,
  GuildChannel,
  GuildTextBasedChannel,
  NewsChannel,
  NonThreadGuildBasedChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import manageRoles from './manageRoles';
import { EmbedBuilder } from '@discordjs/builders';
import { RolesField } from '../settings/SettingsDB';
import GuildSettings from '../settings/GuildSettings';

/**
 * Manages the roles for each user with a message with button in a channel
 */
export default class RoleChannelManager {
  /** The guild this manager operates in */
  public _guild: Guild;
  /** The set roles channel used for the guild */
  public _channel?: GuildTextBasedChannel;
  /** All role channel managers */
  public static mgrs: RoleChannelManager[] = [];

  constructor(guild: Guild) {
    this._guild = guild;
    RoleChannelManager.mgrs.push(this);
  }

  /**
   * Uses the set roles channel if it exists or checks if a roles channel exists and
   * sets that one as set roles channel
   * 
   * Sends/updates the roles embed
   */
  public async run(): Promise<void> {
    const rolesChannel: GuildTextBasedChannel | undefined =
      this._channel ??
      (this._guild.channels.cache.find(
        (channel: GuildChannel | ThreadChannel): boolean =>
          channel.name === 'roles' &&
          (channel instanceof TextChannel ||
            channel instanceof ThreadChannel ||
            channel instanceof NewsChannel)
      ) as GuildTextBasedChannel | undefined);
    if (!rolesChannel) return;

    this._channel = rolesChannel;

    const embed: EmbedBuilder = await this.generateEmbed();

    manageRoles(rolesChannel, embed);
  }

  /**
   * Generates an the roles embed
   * @returns The message embed to be posted
   */
  private async generateEmbed(): Promise<MessageEmbed> {
    const roles: RolesField[] = (await GuildSettings.settings(this._guild.id))
      .roles;

    const errorRole: boolean = roles.some(
      (role: RolesField): boolean => !role.emoji || !role.name
    );
    if (errorRole)
      return new EmbedBuilder()
        .setTimestamp(Date.now())
        .setTitle('Role Selector')
        .setDescription(
          'Error: All fields in `role` in `settings.json` must have a `name` and `emoji` tag'
        )
        .setColor([255, 0, 0]);
    return new EmbedBuilder()
      .setTimestamp(Date.now())
      .setTitle('Role Selector')
      .setFields(
        roles.map(
          (role: RolesField): APIEmbedField => ({
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
