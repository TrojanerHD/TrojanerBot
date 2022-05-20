import { Channel } from './messages/StreamerCommand';
import fs from 'fs';
import DMManager from './twitch/DMManager';

export interface RolesField {
  name: string;
  emoji: string;
  description?: string;
}
export interface SettingsJSON {
  'twitch-id': string;
  'permission-roles': string[];
  roles: RolesField[];
  streamers: string[];
  logging: 'verbose' | 'errors' | 'warnings';
  'streamer-subscriptions': Channel[];
  'express-port'?: number;
}

export default class Settings {
  private static _settingsFile: string = './settings.json';
  private static _settings: SettingsJSON = {
    'twitch-id': '',
    'permission-roles': [],
    roles: [],
    streamers: [],
    logging: 'warnings',
    'streamer-subscriptions': [],
  };

  static getSettings(): SettingsJSON {
    if (!fs.existsSync(Settings._settingsFile)) {
      Settings.saveSettings();
    } else {
      const settingsFileContent: string = fs.readFileSync(
        Settings._settingsFile,
        'utf8'
      );
      const newSettings: undefined | SettingsJSON =
        Settings.getJsonString(settingsFileContent);
      if (!newSettings) Settings.saveSettings();
      else {
        let changed: boolean = false;
        if (
          Object.keys(Settings._settings).some(
            (key: string): boolean => !(key in newSettings)
          )
        ) {
          for (const untypedSetting of Object.keys(newSettings)) {
            const setting: keyof SettingsJSON =
              untypedSetting as keyof SettingsJSON;
            //TODO: Understand what is going on here and document code
            //@ts-ignore
            Settings._settings[setting] = newSettings[setting] as any;
          }
          changed = true;
        }
        //TODO: This is a hard-coded checker to see if every streamer has a sent boolean because there was a version where it was not there. Very hacky
        if (
          Settings._settings['streamer-subscriptions'].some(
            (key: Channel): boolean => key.sent === undefined
          )
        ) {
          Settings._settings['streamer-subscriptions'].forEach(
            (channel: Channel, i: number) => {
              if (channel.sent === undefined)
                Settings._settings['streamer-subscriptions'][i].sent = false;
            }
          );
          changed = true;
        }
        // Backwards compatibility: If users added streamers with invalid characters in previous versions of the bot, they get deleted
        if (
          Settings._settings['streamer-subscriptions'].some(
            (channel: Channel) =>
              !channel.streamer.match(DMManager.validNameRegex)
          )
        ) {
          Settings._settings['streamer-subscriptions'] = Settings._settings[
            'streamer-subscriptions'
          ].filter(
            (channel: Channel) =>
              !!channel.streamer.match(DMManager.validNameRegex)
          );
          changed = true;
        }
        if (changed) Settings.saveSettings();
      }
      Settings._settings = JSON.parse(settingsFileContent);
    }
    return Settings._settings;
  }

  private static getJsonString(str: string): undefined | SettingsJSON {
    try {
      return JSON.parse(str);
    } catch (e) {
      return undefined;
    }
  }

  static saveSettings(): void {
    fs.writeFileSync(
      Settings._settingsFile,
      JSON.stringify(Settings._settings, null, 2),
      'utf8'
    );
  }
}
