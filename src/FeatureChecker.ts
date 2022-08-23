import Settings from './Settings';

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

  constructor() {
    if (Settings.settings.logging === 'verbose')
      this.status('Logging set to verbose');
    if (Settings.settings['permission-roles'].length === 0)
      this.warning('No permitted roles set (field "permission-roles" empty)');
    if (Settings.settings.roles.length === 0) this.status('Roles disabled');
    else this.status('Roles enabled');
    if (Settings.settings['twitch-id'])
      if (process.env.TWITCH_TOKEN) this.status('Twitch enabled');
      else this.warning('No Twitch token provided');
    else if (process.env.TWITCH_TOKEN) this.warning('No Twitch ID provided');
    else this.status('Twitch disabled');
    if (Settings.settings.roles.length > 25)
      this.error(
        'Currently, only a maximum of 25 roles is allowed. If you need more, file an issue at https://github.com/TrojanerHD/TrojanerBot/issues/new'
      );
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
   */
  private error(message: string): void {
    this.#message += `Error: ${message}\n`;
    this.#crash = true;
  }
}
