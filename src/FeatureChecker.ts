import { Guild } from 'discord.js';
import DiscordClient from './DiscordClient';
import Settings from './Settings';
import GuildSettings from './settings/GuildSettings';
import { GuildInfo } from './settings/SettingsDB';

/**
 * Checks what features are enabled in the settings
 */
export default class FeatureChecker {
  /**
   * The output log
   */
  #message: string = '';

  /**
   * Whether to crash due to critical errors
   */
  #crash: boolean = false;

  public async check() {
    if (Settings.settings.logging === 'verbose')
      this.status('Logging set to verbose');
    for (const guild of DiscordClient._client.guilds.cache.toJSON())
      await this.checkGuild(guild);

    if (Settings.settings['twitch-id'])
      if (process.env.TWITCH_TOKEN) this.status('Twitch enabled');
      else this.warning('No Twitch token provided');
    else if (process.env.TWITCH_TOKEN) this.warning('No Twitch ID provided');
    else this.status('Twitch disabled');
    if (
      process.argv[
        process.argv.findIndex((value: string): boolean => value === '-r') + 1
      ] === 'dotenv/config'
    )
      this.warning(
        'You specified the -r dotenv/config option which is not required anymore'
      );
    console.log(this.#message.trim());
    if (this.#crash) process.exit(1);
  }

  public async checkGuild(guild: Guild): Promise<void> {
    const guildInfo: string = `for guild ${guild.id} (${guild.name})`;
    let error: boolean = false;
    try {
      const info: GuildInfo = await GuildSettings.settings(guild.id);
      if (info.permissionRoles.length === 0)
        this.status(`No permitted roles set for ${guildInfo}`);
      if (info.roles.length === 0) this.status(`Roles disabled ${guildInfo}`);
      else this.status(`Roles enabled ${guildInfo}`);
      if (info.roles.length > 25) {
        error = true;
        this.error(
          `Currently, only a maximum of 25 roles is allowed. Guild ${guild.id} (${guild.name}) has more than 25 roles. If you need more, file an issue at https://github.com/TrojanerHD/TrojanerBot/issues/new`,
          false
        );
      }
    } catch (e: unknown) {
      error = true;
      this.error(
        `Could not load information ${guildInfo} with reason ${e}`,
        false
      );
    } finally {
      if (!error) {
        DiscordClient._safeGuilds.push(guild);
        if (!GuildSettings.settings(guild.id))
          await GuildSettings.saveSettings(guild, {
            permissionRoles: [],
            roles: [],
            streamers: [],
          }).catch(console.error);
      } else this.warning(`Limited features due to problems ${guildInfo}`);
    }
  }

  /**
   * Appends a warning to the log output
   * @param message The warning message to append
   */
  private warning(message: string): void {
    if (Settings.settings.logging !== 'errors')
      this.#message += `Warning: ${message}\n`;
  }

  /**
   * Appends a status to the log output
   * @param message The status message to append
   */
  private status(message: string): void {
    if (Settings.settings.logging === 'verbose')
      this.#message += `Status: ${message}\n`;
  }

  /**
   * Appends an error to the log output and will crash the bot
   * @param message The error message to append
   * @param crash Whether to crash the bot
   */
  private error(message: string, crash: boolean = true): void {
    this.#message += `Error: ${message}\n`;
    if (!this.#crash) this.#crash = crash;
  }
}
