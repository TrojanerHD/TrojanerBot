import Settings from './Settings';

export default class FeatureChecker {
  #message: string = '';
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
    console.log(this.#message.trim());
  }

  private warning(message: string): void {
    this.#message += `Warning: ${message}\n`;
  }

  private status(message: string): void {
    if (Settings.getSettings().logging === 'verbose')
      this.#message += `Status: ${message}\n`;
  }
}
