import Settings from './Settings';

export default class FeatureChecker {
  #message: string = '';
  #crash: boolean = false;

  constructor() {
    if (Settings.getSettings().logging === 'verbose')
      this.status('Logging set to verbose');
    if (Settings.getSettings()['permission-roles'].length === 0)
      this.warning('No permitted roles set (field "permission-roles" empty)');
    if (Settings.getSettings().roles.length === 0)
      this.status('Roles disabled');
    else this.status('Roles enabled');
    if (Settings.getSettings()['twitch-id'])
      if (process.env.TWITCH_TOKEN) this.status('Twitch enabled');
      else this.warning('No Twitch token provided');
    else if (process.env.TWITCH_TOKEN) this.warning('No Twitch ID provided');
    else this.status('Twitch disabled');
    if (Settings.getSettings().roles.length > 25)
      this.error(
        'Currently, only a maximum of 25 roles is allowed. If you need more, file an issue at https://github.com/TrojanerHD/TrojanerBot/issues/new'
      );
    console.log(this.#message.trim());
    if (this.#crash) process.exit(1);
  }

  private warning(message: string): void {
    if (Settings.getSettings().logging !== 'errors')
      this.#message += `Warning: ${message}\n`;
  }

  private status(message: string): void {
    if (Settings.getSettings().logging === 'verbose')
      this.#message += `Status: ${message}\n`;
  }

  private error(message: string): void {
    this.#message += `Error: ${message}\n`;
    this.#crash = true;
  }
}
